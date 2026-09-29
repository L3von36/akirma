/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — Site API worker (akirmaevents.com)
 * ═══════════════════════════════════════════════════════════════
 *  Serves the static site (assets) plus a small booking-inquiry API:
 *
 *    POST   /api/inquiry        visitors submit the contact/booking form
 *    POST   /api/subscriber     visitors join the newsletter
 *    GET    /api/health         uptime check
 *    POST   /api/admin/login    admin: exchange PIN for a session token
 *    POST   /api/admin/logout   admin: invalidate the current session
 *    GET    /api/inquiries      admin: list inquiries     (Bearer token)
 *    PATCH  /api/inquiry        admin: update status      (Bearer token)
 *    DELETE /api/inquiry        admin: delete one         (Bearer token)
 *    GET    /api/subscribers    admin: list subscribers   (Bearer token)
 *    DELETE /api/subscriber     admin: delete one         (Bearer token)
 *
 *  Inquiries and newsletter subscribers are stored in Cloudflare KV
 *  (binding INQUIRIES) and appear in the admin dashboard at /admin.html.
 *  There is no demo/mock mode anywhere: when the API is unreachable the
 *  dashboard shows an explicit error instead of sample records.
 *
 *  SECURITY MODEL (no secrets in the client bundle):
 *  - The PIN lives ONLY in the worker secret ADMIN_PIN
 *      npx wrangler secret put ADMIN_PIN
 *  - POST /api/admin/login validates it server-side (constant-time
 *    compare) with per-IP brute-force lockout (5 fails → 15 min).
 *  - Success returns a random session token stored in KV with an 8h
 *    TTL (sliding). Admin endpoints require `Authorization: Bearer`.
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

const PREFIX = 'inq:';      // keys look like: inq:<reverse-timestamp>:<id> → newest first
const SUB_PREFIX = 'sub:';   // newsletter subscribers: sub:<reverse-timestamp>:<id>
const SESS_PREFIX = 'sess:'; // admin sessions: sess:<token>
const SESSION_TTL = 8 * 3600;      // 8 hours (seconds)
const LOGIN_MAX_FAILS = 5;         // failed PIN attempts before lockout
const LOGIN_LOCKOUT = 15 * 60;     // lockout duration (seconds)

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
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

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

      // ── admin auth (server-side PIN → session token) ────
      if (request.method === 'POST' && path === '/api/admin/login') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const lockSecs = await loginLocked(env, ip);
        if (lockSecs) return json({ ok: false, error: 'rate_limited', retry_after: lockSecs }, 429,
          { 'Retry-After': String(lockSecs) });

        if (!env.ADMIN_PIN) return json({ ok: false, error: 'pin_not_configured' }, 503);

        const body = await readJson(request, 1024);
        if (!body || typeof body.pin !== 'string') return json({ ok: false, error: 'bad_request' }, 400);

        if (!timingSafeEq(body.pin, env.ADMIN_PIN)) {
          await loginFail(env, ip);
          return json({ ok: false, error: 'invalid_pin' }, 401);
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

      return json({ ok: false, error: 'not_found' }, 404);
    } catch (err) {
      console.error('API error:', err);
      return json({ ok: false, error: 'server_error' }, 500);
    }
  },
};
