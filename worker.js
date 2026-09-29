/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — Site API worker (akirmaevents.com)
 * ═══════════════════════════════════════════════════════════════
 *  Serves the static site (assets) plus a small booking-inquiry API:
 *
 *    POST   /api/inquiry     visitors submit the contact/booking form
 *    GET    /api/health      uptime check
 *    GET    /api/inquiries   admin: list inquiries   (X-Admin-PIN header)
 *    PATCH  /api/inquiry     admin: update status    (X-Admin-PIN header)
 *    DELETE /api/inquiry     admin: delete one       (X-Admin-PIN header)
 *
 *  Inquiries are stored in Cloudflare KV (binding INQUIRIES) and appear
 *  in the admin dashboard at /admin.html (PIN-protected server-side).
 *
 *  NOTE: the admin PIN defaults to js/config.js ADMIN.DEMO_PIN ('2519').
 *  To harden, deploy a secret:  npx wrangler secret put ADMIN_PIN
 *  (the dashboard PIN in config.js must be changed to match).
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

const PIN_FALLBACK = '2519';
const PREFIX = 'inq:'; // keys look like: inq:<reverse-timestamp>:<id>  → newest first

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Read a JSON body. Returns object | null (too large) | undefined (bad JSON). */
async function readJson(request, maxBytes = 16 * 1024) {
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try { return JSON.parse(raw); } catch (e) { return undefined; }
}

function cap(s, n) { return typeof s === 'string' ? s.trim().slice(0, n) : ''; }

function checkPin(request, env) {
  const pin = request.headers.get('X-Admin-PIN') || '';
  return pin !== '' && pin === (env.ADMIN_PIN || PIN_FALLBACK);
}

/** Best-effort per-IP damping: max 12 submissions per hour. */
async function rateLimited(env, request) {
  if (!env.INQUIRIES) return false;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rl:${bucket}:${ip}`;
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
  if (!env.INQUIRIES || !id) return null;
  const suffix = ':' + id;
  let cursor;
  do {
    const page = await env.INQUIRIES.list({ prefix: PREFIX, cursor, limit: 100 });
    for (const k of page.keys) {
      if (k.name.endsWith(suffix)) return k.name;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return null;
}

async function listInquiries(env, max = 300) {
  const items = [];
  if (!env.INQUIRIES) return items;
  let cursor;
  do {
    const page = await env.INQUIRIES.list({ prefix: PREFIX, cursor, limit: 100 });
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
        if (await rateLimited(env, request)) return json({ ok: false, error: 'rate_limited' }, 429);
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

      // ── admin endpoints (PIN protected) ─────────────────
      const admin = checkPin(request, env);

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

      return json({ ok: false, error: 'not_found' }, 404);
    } catch (err) {
      console.error('API error:', err);
      return json({ ok: false, error: 'server_error' }, 500);
    }
  },
};
