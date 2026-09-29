/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — Site API worker (akirmaevents.com)
 * ═══════════════════════════════════════════════════════════════
 *  Serves the static site (assets) plus a small booking-inquiry API:
 *
 *    POST   /api/inquiry        visitors submit the contact/booking form
 *    POST   /api/subscriber     visitors join the newsletter
 *    GET    /api/health         uptime check
 *    POST   /api/admin/login             admin: exchange password for a session token
 *    POST   /api/admin/logout            admin: invalidate the current session
 *    POST   /api/admin/forgot-password   email a single-use reset link to the owner
 *    POST   /api/admin/reset-password    exchange reset token for a new password
 *    POST   /api/admin/change-password   admin: change password (Bearer token)
 *
 *    Legacy aliases (same behavior, kept so old links/clients never 404):
 *    POST   /api/admin/forgot-pin  =  forgot-password
 *    POST   /api/admin/reset-pin   =  reset-password
 *    GET    /api/inquiries      admin: list inquiries     (Bearer token)
 *    PATCH  /api/inquiry        admin: update status      (Bearer token)
 *    DELETE /api/inquiry        admin: delete one         (Bearer token)
 *    GET    /api/subscribers    admin: list subscribers   (Bearer token)
 *    DELETE /api/subscriber     admin: delete one         (Bearer token)
 *    GET    /api/notify-status  admin: email alert config (Bearer token)
 *    POST   /api/notify-test    admin: send a test alert  (Bearer token)
 *
 *    Event Manager — the owner's private record of every event he did:
 *    GET    /api/em-events      admin: list tracked events (Bearer token)
 *    POST   /api/em-events      admin: create/update one  (Bearer token)
 *    DELETE /api/em-events      admin: delete one         (Bearer token)
 *
 *  Inquiries and newsletter subscribers are stored in Cloudflare KV
 *  (binding INQUIRIES) and appear in the admin dashboard at /admin.html.
 *
 *  EMAIL ALERTS: every new booking inquiry triggers an email to the
 *  NOTIFY_EMAIL address (wrangler.jsonc vars) through the SEND_EMAIL
 *  binding (Cloudflare Email Routing, sender NOTIFY_FROM). The alert is
 *  sent with ctx.waitUntil AFTER the inquiry is safely stored — an email
 *  failure is logged but NEVER blocks or fails the booking itself. Real
 *  delivery requires Email Routing to be enabled for the zone and the
 *  recipient to be a verified destination address; until then the test
 *  button in the admin Settings tab reports the exact error.
 *  There is no demo/mock mode anywhere: when the API is unreachable the
 *  dashboard shows an explicit error instead of sample records.
 *
 *  SECURITY MODEL (no secrets in the client bundle):
 *  - The admin password lives ONLY server-side, as a PBKDF2-SHA256 hash
 *    in KV under `admin:pass` (format: pbkdf2-sha256$<iter>$<salt>$<hash>).
 *    It is set via the emailed reset link, or from the dashboard's
 *    Settings → Security card (POST /api/admin/change-password).
 *  - Legacy credentials are still honored for a seamless migration and
 *    are auto-upgraded to a PBKDF2 hash on first successful use:
 *      · the old ADMIN_PIN worker secret (npx wrangler secret put ADMIN_PIN)
 *      · the old self-service-reset PIN hash in KV `admin:pin` (SHA-256)
 *  - POST /api/admin/login validates server-side (constant-time compare)
 *    with per-IP brute-force lockout (5 fails → 15 min, Durable Object).
 *  - PBKDF2 iterations (25k) are deliberately modest because Workers free
 *    plan caps request CPU at ~10 ms; the DO lockout is the primary
 *    brute-force defense and the KV-stored hash never leaves the server.
 *  - Success returns a random session token stored in KV with an 8h
 *    TTL (sliding). Admin endpoints require `Authorization: Bearer`.
 * ═══════════════════════════════════════════════════════════════
 */
import { EmailMessage } from 'cloudflare:email';

'use strict';

const PREFIX = 'inq:';      // keys look like: inq:<reverse-timestamp>:<id> → newest first
const SUB_PREFIX = 'sub:';   // newsletter subscribers: sub:<reverse-timestamp>:<id>
const EM_PREFIX = 'em:';     // event-manager records: em:<reverse-timestamp>:<id>
const EM_STATUSES = ['inquiry', 'confirmed', 'prep', 'completed', 'cancelled'];
const SESS_PREFIX = 'sess:'; // admin sessions: sess:<token>
const SESSION_TTL = 8 * 3600;      // 8 hours (seconds)
const LOGIN_MAX_FAILS = 5;         // failed sign-in attempts before lockout
const LOGIN_LOCKOUT = 15 * 60;     // lockout duration (seconds)
const ALERT_FROM_FALLBACK = 'notifications@akirmaevents.com';

const RESET_PREFIX = 'pwreset:';   // password reset tokens: pwreset:<token> → {ip, ts}
const RESET_TTL = 15 * 60;         // reset link validity (seconds)
const PIN_HASH_KEY = 'admin:pin';  // LEGACY: KV-stored SHA-256 hex of a self-service-reset PIN
const PASS_HASH_KEY = 'admin:pass';// KV-stored PBKDF2 record of the admin password
const FORGOT_COOLDOWN = 5 * 60;    // min seconds between forgot-password emails per IP
const PBKDF2_ITERATIONS = 25000;   // see SECURITY MODEL note on the Workers CPU budget
const PASSWORD_MIN = 8;            // minimum password length
const PASSWORD_MAX = 128;          // maximum password length

/**
 * Login brute-force guard — one Durable Object instance per client IP.
 * A DO is required because neither KV (reads may lag ~60s) nor the Cache
 * API (cross-request same-key reads are unreliable) can count rapid-fire
 * failed attempts accurately. DO storage is strongly consistent.
 */
export class LoginGuard {
  constructor(state, env) { this.state = state; this.sql = state.storage.sql; }

  getUntil() {
    const rows = [...this.sql.exec('SELECT v FROM meta WHERE k = ?', 'until')];
    return rows.length ? Number(rows[0].v) : 0;
  }

  async fetch(request) {
    this.sql.exec('CREATE TABLE IF NOT EXISTS fails (ts INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v INTEGER NOT NULL)');
    const now = Date.now();
    const cmd = new URL(request.url).pathname;

    if (cmd === '/check') {
      const until = this.getUntil();
      return Response.json({ locked_for: until > now ? Math.ceil((until - now) / 1000) : 0 });
    }

    if (cmd === '/fail') {
      this.sql.exec('INSERT INTO fails VALUES (?)', now);
      this.sql.exec('DELETE FROM fails WHERE ts < ?', now - LOGIN_LOCKOUT * 1000);
      const n = Number([...this.sql.exec('SELECT COUNT(*) AS c FROM fails')][0].c);
      if (n >= LOGIN_MAX_FAILS) {
        const until = now + LOGIN_LOCKOUT * 1000;
        this.sql.exec('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', 'until', until);
        return Response.json({ fails: n, locked_for: LOGIN_LOCKOUT });
      }
      return Response.json({ fails: n, locked_for: 0 });
    }

    if (cmd === '/forgot') {
      // Strongly-consistent per-IP cooldown for PIN reset emails.
      // (KV is only eventually consistent and misses rapid bursts.)
      const rows = [...this.sql.exec('SELECT v FROM meta WHERE k = ?', 'forgot_until')];
      const until = rows.length ? Number(rows[0].v) : 0;
      if (until > now) {
        return Response.json({ cooldown: Math.ceil((until - now) / 1000) });
      }
      const set = now + FORGOT_COOLDOWN * 1000;
      this.sql.exec('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', 'forgot_until', set);
      return Response.json({ cooldown: 0 });
    }

    if (cmd === '/reset') {
      this.sql.exec('DELETE FROM fails');
      this.sql.exec('DELETE FROM meta');
      return Response.json({ ok: true });
    }

    return new Response('not found', { status: 404 });
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }, extraHeaders),
  });
}

/** Read a JSON body. Returns object | null (too large) | undefined (bad JSON). */
async function readJson(request, maxBytes = 16 * 1024) {
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try { return JSON.parse(raw); } catch (e) { return undefined; }
}

function cap(s, n) { return typeof s === 'string' ? s.trim().slice(0, n) : ''; }

/** Constant-time string compare so response timing can't leak the PIN. */
function timingSafeEq(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** SHA-256 of a string as lowercase hex (legacy PIN storage, never plaintext). */
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Password hashing (PBKDF2-SHA256, stored record format below) ──
 * Stored record: `pbkdf2-sha256$<iterations>$<saltBase64>$<hashHex>`
 * The iteration count travels with the record so it can be raised later
 * without invalidating existing passwords. */
function b64encode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2Hex(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Hash a password into the storable KV record. */
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hex = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
  return 'pbkdf2-sha256$' + PBKDF2_ITERATIONS + '$' + b64encode(salt) + '$' + hex;
}

/** Verify a password against a stored record. Returns false on any
 *  malformed record (never throws). Constant-time final compare. */
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iter = parseInt(parts[1], 10);
  if (!Number.isInteger(iter) || iter < 1000 || iter > 2000000) return false;
  let salt;
  try { salt = b64decode(parts[2]); } catch (e) { return false; }
  const hex = await pbkdf2Hex(password, salt, iter);
  return timingSafeEq(hex, parts[3]);
}

/** Server-side password policy for set/change/reset. */
function passwordValid(pw) {
  return typeof pw === 'string' && pw.length >= PASSWORD_MIN && pw.length <= PASSWORD_MAX;
}

/**
 * Verify admin credentials against every supported store, oldest first:
 *   1. legacy self-service-reset PIN (KV admin:pin, SHA-256)
 *   2. legacy ADMIN_PIN worker secret
 *   3. current password (KV admin:pass, PBKDF2)
 * Returns the matched kind, or null. When a LEGACY credential matches and
 * no PBKDF2 password exists yet, it is transparently upgraded: the same
 * secret is re-hashed with PBKDF2 into admin:pass and the weak legacy
 * record is deleted — the owner keeps signing in with the same value.
 */
async function verifyAdminCredential(env, secret) {
  const kv = env.INQUIRIES;
  const passRec = kv ? await kv.get(PASS_HASH_KEY) : null;
  const pinHash = kv ? await kv.get(PIN_HASH_KEY) : null;

  let kind = null;
  if (pinHash && timingSafeEq(await sha256Hex(secret), pinHash)) kind = 'pin-kv';
  else if (env.ADMIN_PIN && timingSafeEq(secret, env.ADMIN_PIN)) kind = 'pin-secret';
  else if (passRec && (await verifyPassword(secret, passRec))) kind = 'password';
  if (!kind) return null;

  // Transparent legacy → PBKDF2 upgrade (one-time).
  if (kind !== 'password' && kv && !passRec) {
    await kv.put(PASS_HASH_KEY, await hashPassword(secret));
    if (pinHash) await kv.delete(PIN_HASH_KEY);
  }
  return kind;
}

/**
 * Brute-force guard helpers — delegate to a per-IP Durable Object
 * (strongly consistent; see LoginGuard class above).
 */
function guardStub(env, ip) {
  return env.LOGIN_GUARD.get(env.LOGIN_GUARD.idFromName(ip));
}

async function loginLocked(env, ip) {
  try {
    const r = await guardStub(env, ip).fetch('https://guard/check');
    const d = await r.json();
    return d.locked_for > 0 ? d.locked_for : null;
  } catch (e) { return null; } // guard unavailable — fail open
}

async function loginFail(env, ip) {
  try { await guardStub(env, ip).fetch('https://guard/fail'); } catch (e) { /* ignore */ }
}

async function loginReset(env, ip) {
  try { await guardStub(env, ip).fetch('https://guard/reset'); } catch (e) { /* ignore */ }
}

/**
 * Validate the `Authorization: Bearer <token>` header against KV sessions.
 * Sliding expiry: re-armed at most once per hour (avoids a KV write on
 * every admin request).
 */
async function checkAuth(request, env) {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  if (!m || !env.INQUIRIES) return false;
  const key = SESS_PREFIX + m[1];
  const raw = await env.INQUIRIES.get(key);
  if (!raw) return false;
  let rec = null;
  try { rec = JSON.parse(raw); } catch (e) { return false; }
  const age = Date.now() - (rec.createdAt || 0);
  if (age > 3600 * 1000) {
    rec.createdAt = Date.now();
    await env.INQUIRIES.put(key, JSON.stringify(rec), { expirationTtl: SESSION_TTL }); // slide
  }
  return true;
}

function bearerToken(request) {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : '';
}

/** Best-effort per-IP damping: max 12 submissions per hour.
 *  `kind` separates buckets so the contact form and the newsletter
 *  never block each other. */
async function rateLimited(env, request, kind = 'inq') {
  if (!env.INQUIRIES) return false;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rl${kind === 'inq' ? '' : kind}:${bucket}:${ip}`;
  const cur = parseInt((await env.INQUIRIES.get(key)) || '0', 10);
  if (cur >= 12) return true;
  await env.INQUIRIES.put(key, String(cur + 1), { expirationTtl: 7200 });
  return false;
}

function newId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/* ══ EMAIL ALERTS (new booking inquiry → NOTIFY_EMAIL) ═════════ */

/** Header values must never contain raw CRLF or non-ASCII — encode both. */
function utf8ToBase64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function headerSafe(s) {
  s = String(s || '').replace(/[\r\n\u2028\u2029]+/g, ' ').trim();
  if (!/[^\x20-\x7E]/.test(s)) return s; // pure ASCII → as-is
  // RFC 2047 encoded-word (UTF-8 base64) — handles Amharic names too
  return '=?UTF-8?B?' + utf8ToBase64(s) + '?=';
}

/** Build a readable plain-text alert email (raw MIME). */
function buildInquiryAlertEmail(rec, from, to) {
  const when = new Date(rec.createdAt || Date.now()).toISOString();
  const subject = 'New booking inquiry — ' + (rec.name || 'unnamed') +
    (rec.event_type ? ' (' + rec.event_type + ')' : '');
  const lines = [
    'A new booking inquiry was just submitted through akirmaevents.com.',
    '',
    '----------------------------------------',
    'Name:        ' + (rec.name || '-'),
    'Email:       ' + (rec.email || '-'),
    'Phone:       ' + (rec.phone || '-'),
    'Event type:  ' + (rec.event_type || '-'),
    'Event date:  ' + (rec.event_date || '-'),
    'Received:    ' + when,
    '----------------------------------------',
    '',
    'Message:',
    (rec.message || '(no message)'),
    '',
    '',
    'Manage it in the admin dashboard: https://akirmaevents.com/admin.html',
    'This is an automated notification — please reply to the customer directly.',
  ];
  return {
    subject,
    raw: [
      'From: Akirma Events Website <' + from + '>',
      // Replies go straight to the customer, not back to the website mailbox
      ...(rec.email ? ['Reply-To: ' + rec.email] : []),
      'To: <' + to + '>',
      'Subject: ' + headerSafe(subject),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      'X-Website-Auto-Alert: booking-inquiry',
      '',
      lines.join('\r\n'),
    ].join('\r\n'),
  };
}

/** Send the notification. Never throws — returns {ok} so callers can log. */
async function sendAlert(env, { subject, raw }) {
  const from = env.NOTIFY_FROM || ALERT_FROM_FALLBACK;
  const to = env.NOTIFY_EMAIL;
  if (!env.SEND_EMAIL) return { ok: false, error: 'email_binding_missing' };
  if (!to) return { ok: false, error: 'notify_email_not_configured' };
  try {
    await env.SEND_EMAIL.send(new EmailMessage(from, to, raw));
    return { ok: true, to };
  } catch (e) {
    return { ok: false, error: 'send_failed', detail: String((e && e.message) || e) };
  }
}

/** Fire-and-forget alert for a stored inquiry — logs, never throws. */
async function notifyNewInquiry(env, rec) {
  const mail = buildInquiryAlertEmail(rec, env.NOTIFY_FROM || ALERT_FROM_FALLBACK, env.NOTIFY_EMAIL || '');
  const r = await sendAlert(env, mail);
  if (r.ok) console.log('Booking alert sent to ' + r.to + ' (inquiry ' + rec.id + ')');
  else console.warn('Booking alert not sent (' + r.error + (r.detail ? ': ' + r.detail : '') + ') for inquiry ' + rec.id);
}

function buildTestAlertEmail(from, to) {
  const subject = 'Akirma Events — test booking alert';
  const lines = [
    'This is a test alert from your website booking system.',
    '',
    'If you can read this, email alerts are working: every new booking',
    'inquiry submitted on akirmaevents.com will now arrive in this inbox.',
    '',
    'Sent: ' + new Date().toISOString(),
  ];
  return {
    subject,
    raw: [
      'From: Akirma Events Website <' + from + '>',
      'To: <' + to + '>',
      'Subject: ' + headerSafe(subject),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      'X-Website-Auto-Alert: test',
      '',
      lines.join('\r\n'),
    ].join('\r\n'),
  };
}

function buildResetEmail(from, link, ip) {
  const subject = 'Reset your admin password — Akirma Events';
  const lines = [
    'Hello,',
    '',
    'Someone (hopefully you) asked to reset the admin password for',
    'https://akirmaevents.com/admin.html.',
    '',
    'Open this link to choose a new password (works once, expires in 15 minutes):',
    '',
    link,
    '',
    'Request details:',
    '- Time: ' + new Date().toISOString(),
    '- IP:   ' + ip,
    '',
    'If you did not request this, ignore this email — your current password',
    'keeps working and nothing has changed.',
    '',
    '— Akirma Events website (automated message)',
  ];
  return {
    subject,
    raw: [
      'From: Akirma Events Website <' + from + '>',
      'Subject: ' + headerSafe(subject),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      'X-Website-Auto-Alert: password-reset',
      '',
      lines.join('\r\n'),
    ].join('\r\n'),
  };
}

function sanitizeInquiry(b) {
  // Accept both name styles: API style (name/email) and the contact-form's
  // EmailJS-style keys (from_name/from_email) — see js/app.js getContactParams().
  return {
    name: cap(b.name ?? b.from_name, 120),
    email: cap(b.email ?? b.from_email, 200),
    phone: cap(b.phone, 40),
    event_type: cap(b.event_type, 80),
    event_date: cap(b.event_date, 40),
    message: cap(b.message, 4000),
  };
}

/* ── Event Manager records (private business bookkeeping) ──
 * Whitelisted fields only; numbers coerced to non-negative integers;
 * date must be yyyy-mm-dd; status from a fixed set. */
function sanitizeEmEvent(b) {
  const num = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? n : 0; };
  return {
    id: cap(b.id, 40) || undefined,
    client: cap(b.client, 120),
    phone: cap(b.phone, 40),
    email: cap(b.email, 200),
    type: cap(b.type, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || '')) ? String(b.date) : '',
    location: cap(b.location, 160),
    guests: cap(b.guests, 40),
    price: num(b.price),
    advance: num(b.advance),
    status: EM_STATUSES.includes(b.status) ? b.status : 'inquiry',
    notes: cap(b.notes, 2000),
  };
}

async function findKeyById(env, id) {
  return findKeyByPrefixAndId(env, PREFIX, id);
}

async function findKeyByPrefixAndId(env, prefix, id) {
  if (!env.INQUIRIES || !id) return null;
  const suffix = ':' + id;
  let cursor;
  do {
    const page = await env.INQUIRIES.list({ prefix, cursor, limit: 100 });
    for (const k of page.keys) {
      if (k.name.endsWith(suffix)) return k.name;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return null;
}

async function listInquiries(env, max = 300) {
  return listByPrefix(env, PREFIX, max);
}

/** Generic newest-first KV listing under a key prefix. */
async function listByPrefix(env, prefix, max) {
  const items = [];
  if (!env.INQUIRIES) return items;
  let cursor;
  do {
    const page = await env.INQUIRIES.list({ prefix, cursor, limit: 100 });
    for (const k of page.keys) {
      if (items.length >= max) break;
      const v = await env.INQUIRIES.get(k.name);
      if (v) { try { items.push(JSON.parse(v)); } catch (e) { /* skip corrupt */ } }
    }
    if (items.length >= max) break;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return items;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** True when a subscriber with the same normalized email already exists. */
async function subscriberExists(env, norm) {
  const page = await env.INQUIRIES.list({ prefix: SUB_PREFIX, limit: 1000 });
  for (const k of page.keys) {
    const v = await env.INQUIRIES.get(k.name);
    if (!v) continue;
    try { if (JSON.parse(v).norm === norm) return true; } catch (e) { /* skip corrupt */ }
  }
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Force HTTPS — zone-level "Always Use HTTPS" is off, so enforce it here.
    // Plain-HTTP requests get a permanent redirect to the same https:// URL.
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // Static site first — the API lives under /api/
    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      // ── public endpoints ────────────────────────────────
      if (request.method === 'GET' && path === '/api/health') {
        return json({ ok: true, time: new Date().toISOString() });
      }

      if (request.method === 'POST' && path === '/api/inquiry') {
        if (await rateLimited(env, request, 'inq')) return json({ ok: false, error: 'rate_limited' }, 429);
        const body = await readJson(request);
        if (body === null) return json({ ok: false, error: 'payload_too_large' }, 413);
        if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_json' }, 400);

        // Honeypot (hidden "company" field): pretend success, drop silently
        if (typeof body.company === 'string' && body.company.trim() !== '') {
          return json({ ok: true, filtered: true });
        }

        const rec = sanitizeInquiry(body);
        if (!rec.name || !(rec.phone || rec.email)) {
          return json({ ok: false, error: 'missing_fields' }, 400);
        }
        rec.status = 'new';
        rec.createdAt = Date.now();
        rec.source = 'contact_form';
        rec.id = newId();
        if (env.INQUIRIES) {
          const rev = String(9999999999999 - rec.createdAt).padStart(13, '0');
          await env.INQUIRIES.put(PREFIX + rev + ':' + rec.id, JSON.stringify(rec));
        }
        // Email alert AFTER the record is safe — off the response path so a
        // slow/failed send can never delay or break the booking.
        const alertP = notifyNewInquiry(env, rec); // never throws
        if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(alertP);
        else alertP.catch(() => {});
        return json({ ok: true, id: rec.id });
      }

      // ── newsletter signup (public) ──────────────────────
      if (request.method === 'POST' && path === '/api/subscriber') {
        if (await rateLimited(env, request, 'sub')) return json({ ok: false, error: 'rate_limited' }, 429);
        const body = await readJson(request, 1024);
        if (!body || typeof body.email !== 'string') return json({ ok: false, error: 'bad_request' }, 400);
        const email = cap(body.email, 200);
        if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);
        const norm = email.toLowerCase();
        if (await subscriberExists(env, norm)) return json({ ok: true, duplicate: true }); // idempotent success
        const rec = {
          id: newId(),
          email,
          norm,
          createdAt: Date.now(),
          source: cap(body.source, 40) || 'newsletter_footer',
        };
        if (env.INQUIRIES) {
          const rev = String(9999999999999 - rec.createdAt).padStart(13, '0');
          await env.INQUIRIES.put(SUB_PREFIX + rev + ':' + rec.id, JSON.stringify(rec));
        }
        return json({ ok: true, id: rec.id });
      }

      // ── admin auth (server-side password → session token) ────
      if (request.method === 'POST' && path === '/api/admin/login') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const lockSecs = await loginLocked(env, ip);
        if (lockSecs) return json({ ok: false, error: 'rate_limited', retry_after: lockSecs }, 429,
          { 'Retry-After': String(lockSecs) });

        const body = await readJson(request, 2048);
        // `password` is the field name; the legacy `pin` name is accepted
        // so an old cached client can still sign in during propagation.
        const secret = body && typeof body.password === 'string' ? body.password
          : body && typeof body.pin === 'string' ? body.pin : null;
        if (!body || secret === null) return json({ ok: false, error: 'bad_request' }, 400);

        const passRec = env.INQUIRIES ? await env.INQUIRIES.get(PASS_HASH_KEY) : null;
        if (!passRec && !env.ADMIN_PIN) {
          return json({ ok: false, error: 'password_not_configured' }, 503);
        }

        const kind = await verifyAdminCredential(env, secret);
        if (!kind) {
          await loginFail(env, ip);
          return json({ ok: false, error: 'invalid_credentials' }, 401);
        }

        await loginReset(env, ip);
        const token = crypto.randomUUID();
        const rec = JSON.stringify({ ip, createdAt: Date.now(), ua: cap(request.headers.get('User-Agent'), 120) });
        await env.INQUIRIES.put(SESS_PREFIX + token, rec, { expirationTtl: SESSION_TTL });
        return json({ ok: true, token, expires_in: SESSION_TTL });
      }

      if (request.method === 'POST' && path === '/api/admin/logout') {
        const token = bearerToken(request);
        if (token && env.INQUIRIES) await env.INQUIRIES.delete(SESS_PREFIX + token);
        return json({ ok: true });
      }

      // ── self-service password reset (email link to the owner inbox) ────
      // forgot-pin is kept as a legacy alias of forgot-password.
      if (request.method === 'POST' && (path === '/api/admin/forgot-password' || path === '/api/admin/forgot-pin')) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        // Strongly-consistent per-IP cooldown (Durable Object) so this
        // endpoint can't spam the owner inbox with reset emails.
        let cooldown = 0;
        try {
          const g = await guardStub(env, ip).fetch('https://guard/forgot');
          cooldown = ((await g.json()) || {}).cooldown || 0;
        } catch (e) { /* guard unavailable — fail open */ }
        if (cooldown) return json({ ok: false, error: 'rate_limited', retry_after: cooldown }, 429,
          { 'Retry-After': String(Math.ceil(cooldown)) });
        // Uniform success — never reveals whether email delivery is set up
        if (ctx && typeof ctx.waitUntil === 'function' && env.SEND_EMAIL && env.NOTIFY_EMAIL && env.INQUIRIES) {
          const token = [...crypto.getRandomValues(new Uint8Array(24))]
            .map(b => b.toString(16).padStart(2, '0')).join('');
          await env.INQUIRIES.put(RESET_PREFIX + token, JSON.stringify({ ip, ts: Date.now() }),
            { expirationTtl: RESET_TTL });
          const link = new URL('/admin.html?reset=' + token, request.url).toString();
          ctx.waitUntil(sendAlert(env, buildResetEmail(env.NOTIFY_FROM || ALERT_FROM_FALLBACK, link, ip)));
        }
        return json({ ok: true, detail: 'If email alerts are configured, a single-use reset link (valid 15 minutes) was sent to the owner inbox.' });
      }

      // reset-pin is kept as a legacy alias of reset-password.
      if (request.method === 'POST' && (path === '/api/admin/reset-password' || path === '/api/admin/reset-pin')) {
        const body = await readJson(request, 2048);
        const token = body && typeof body.token === 'string' ? body.token.trim() : '';
        const password = body && typeof body.password === 'string' ? body.password
          : body && typeof body.pin === 'string' ? body.pin : null;
        if (!passwordValid(password)) {
          return json({ ok: false, error: 'bad_password', detail: 'Password must be ' + PASSWORD_MIN + '-' + PASSWORD_MAX + ' characters.' }, 400);
        }
        if (!token || !env.INQUIRIES) return json({ ok: false, error: 'bad_request' }, 400);
        const key = RESET_PREFIX + token;
        const val = await env.INQUIRIES.get(key);
        if (!val) {
          return json({ ok: false, error: 'invalid_token', detail: 'This reset link is invalid, already used, or expired. Request a new one.' }, 400);
        }
        await env.INQUIRIES.put(PASS_HASH_KEY, await hashPassword(password)); // new credential (PBKDF2)
        await env.INQUIRIES.delete(PIN_HASH_KEY);                              // retire legacy PIN hash
        await env.INQUIRIES.delete(key);                                       // single use
        // Kill every existing session so old sign-ins stop working
        const sess = await env.INQUIRIES.list({ prefix: SESS_PREFIX });
        await Promise.all(sess.keys.map(k => env.INQUIRIES.delete(k.name)));
        return json({ ok: true, detail: 'Password updated. Sign in with your new password.' });
      }

      // ── change password (admin, Bearer token) — old sessions survive ────
      if (request.method === 'POST' && path === '/api/admin/change-password') {
        if (!(await checkAuth(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const lockSecs = await loginLocked(env, ip);
        if (lockSecs) return json({ ok: false, error: 'rate_limited', retry_after: lockSecs }, 429,
          { 'Retry-After': String(lockSecs) });
        const body = await readJson(request, 4096);
        const current = body && typeof body.current === 'string' ? body.current : null;
        const next = body && typeof body.next === 'string' ? body.next : null;
        if (current === null || !passwordValid(next)) {
          return json({ ok: false, error: 'bad_password', detail: 'New password must be ' + PASSWORD_MIN + '-' + PASSWORD_MAX + ' characters.' }, 400);
        }
        const kind = await verifyAdminCredential(env, current);
        if (!kind) {
          await loginFail(env, ip);
          return json({ ok: false, error: 'invalid_credentials', detail: 'Your current password is incorrect.' }, 401);
        }
        await loginReset(env, ip);
        await env.INQUIRIES.put(PASS_HASH_KEY, await hashPassword(next));
        await env.INQUIRIES.delete(PIN_HASH_KEY); // retire legacy PIN hash
        // Invalidate every OTHER session (keep the one that made the change)
        const keep = bearerToken(request);
        const sess = await env.INQUIRIES.list({ prefix: SESS_PREFIX });
        await Promise.all(sess.keys
          .filter(k => k.name !== SESS_PREFIX + keep)
          .map(k => env.INQUIRIES.delete(k.name)));
        return json({ ok: true, detail: 'Password changed. Other signed-in sessions were signed out.' });
      }

      // ── admin endpoints (Bearer session token) ──────────
      const admin = await checkAuth(request, env);

      if (request.method === 'GET' && path === '/api/inquiries') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        return json({ ok: true, items: await listInquiries(env) });
      }

      if (request.method === 'PATCH' && path === '/api/inquiry') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const body = await readJson(request);
        if (!body || !body.id) return json({ ok: false, error: 'bad_request' }, 400);
        const key = await findKeyById(env, String(body.id));
        if (!key) return json({ ok: false, error: 'not_found' }, 404);
        const rec = JSON.parse(await env.INQUIRIES.get(key));
        const patch = body.patch || {};
        if (['new', 'read', 'replied'].includes(patch.status)) rec.status = patch.status;
        await env.INQUIRIES.put(key, JSON.stringify(rec));
        return json({ ok: true });
      }

      if (request.method === 'DELETE' && path === '/api/inquiry') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const body = await readJson(request);
        if (!body || !body.id) return json({ ok: false, error: 'bad_request' }, 400);
        const key = await findKeyById(env, String(body.id));
        if (key) await env.INQUIRIES.delete(key);
        return json({ ok: true });
      }

      if (request.method === 'GET' && path === '/api/subscribers') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        return json({ ok: true, items: await listByPrefix(env, SUB_PREFIX, 1000) });
      }

      if (request.method === 'DELETE' && path === '/api/subscriber') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const body = await readJson(request);
        if (!body || !body.id) return json({ ok: false, error: 'bad_request' }, 400);
        const key = await findKeyByPrefixAndId(env, SUB_PREFIX, String(body.id));
        if (key) await env.INQUIRIES.delete(key);
        return json({ ok: true });
      }

      // ── event manager (admin) — private list of every booked/done event ────
      if (request.method === 'GET' && path === '/api/em-events') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        return json({ ok: true, items: await listByPrefix(env, EM_PREFIX, 1000) });
      }

      if (request.method === 'POST' && path === '/api/em-events') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const body = await readJson(request);
        if (!body || !body.rec || typeof body.rec !== 'object') return json({ ok: false, error: 'bad_request' }, 400);
        const rec = sanitizeEmEvent(body.rec);
        if (!rec.client && !rec.date) return json({ ok: false, error: 'missing_fields', detail: 'A client name or an event date is required.' }, 400);
        const now = Date.now();
        let key = rec.id ? await findKeyByPrefixAndId(env, EM_PREFIX, rec.id) : null;
        if (key) {
          const old = JSON.parse(await env.INQUIRIES.get(key));
          rec.id = old.id;
          rec.createdAt = old.createdAt || now;
        } else {
          rec.id = newId();
          rec.createdAt = now;
          const rev = String(9999999999999 - now).padStart(13, '0');
          key = EM_PREFIX + rev + ':' + rec.id;
        }
        rec.updatedAt = now;
        await env.INQUIRIES.put(key, JSON.stringify(rec));
        return json({ ok: true, id: rec.id, rec });
      }

      if (request.method === 'DELETE' && path === '/api/em-events') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const body = await readJson(request);
        if (!body || !body.id) return json({ ok: false, error: 'bad_request' }, 400);
        const key = await findKeyByPrefixAndId(env, EM_PREFIX, String(body.id));
        if (key) await env.INQUIRIES.delete(key);
        return json({ ok: true });
      }

      // ── email alert diagnostics (admin) ─────────────────
      if (request.method === 'GET' && path === '/api/notify-status') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        const binding = !!env.SEND_EMAIL;
        const hasTo = !!env.NOTIFY_EMAIL;
        return json({
          ok: true,
          configured: binding && hasTo,
          binding,
          notifyEmail: env.NOTIFY_EMAIL || '',
          from: env.NOTIFY_FROM || ALERT_FROM_FALLBACK,
          hint: binding && hasTo ? '' :
            (!binding ? 'SEND_EMAIL binding is not deployed — enable Email Routing for the domain in the Cloudflare dashboard, then redeploy.' : 'NOTIFY_EMAIL variable is not set in wrangler.jsonc.'),
        });
      }

      if (request.method === 'POST' && path === '/api/notify-test') {
        if (!admin) return json({ ok: false, error: 'unauthorized' }, 401);
        if (!env.SEND_EMAIL) return json({ ok: false, error: 'email_binding_missing', detail: 'The SEND_EMAIL binding is not deployed yet. Enable Email Routing for akirmaevents.com in the Cloudflare dashboard (Email → Email Routing), then redeploy.' });
        if (!env.NOTIFY_EMAIL) return json({ ok: false, error: 'notify_email_not_configured', detail: 'NOTIFY_EMAIL is not set in wrangler.jsonc.' });
        const r = await sendAlert(env, buildTestAlertEmail(env.NOTIFY_FROM || ALERT_FROM_FALLBACK, env.NOTIFY_EMAIL));
        if (r.ok) return json({ ok: true, to: r.to, detail: 'Test alert sent — check the inbox (allow a minute, and check spam).' });
        return json({ ok: false, error: r.error, detail: r.detail || 'Sending failed. Check that Email Routing is enabled for the domain and that ' + env.NOTIFY_EMAIL + ' is a verified destination address (Email → Email Routing → Destination addresses).' });
      }

      return json({ ok: false, error: 'not_found' }, 404);
    } catch (err) {
      console.error('API error:', err);
      return json({ ok: false, error: 'server_error' }, 500);
    }
  },
};
