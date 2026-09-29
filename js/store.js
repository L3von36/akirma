/**
 * AKIRMA EVENTS - js/store.js
 * Data layer for the admin dashboard + public form submissions.
 *
 * SINGLE LIVE MODE — the site's own API (Cloudflare Worker + KV, see
 * worker.js). There is no demo/mock fallback anywhere: if the API is
 * unreachable, calls reject and the dashboard shows an explicit error.
 *
 * SECURITY MODEL (see worker.js):
 *  - The admin password lives only server-side (PBKDF2 hash in KV) and is
 *    verified by POST /api/admin/login (never shipped to the client).
 *  - Successful login returns a random session token (8 h sliding TTL),
 *    kept in sessionStorage for the current tab only and sent as
 *    `Authorization: Bearer` on admin calls.
 *
 * Public site usage (fire-and-forget on the caller's side):
 *   AkirmaStore.saveInquiry({ ... })     // contact form
 *   AkirmaStore.saveSubscriber(email)    // newsletter
 */
(function () {
  'use strict';

  const cfg = (window.AKIRMA_CONFIG || {});

  /* ── SESSION STATE ────────────────────────────────────── */
  const SERVER = {
    token: (function () {
      try { return sessionStorage.getItem('akirma_admin_token') || ''; } catch (e) { return ''; }
    })(),
    expiresAt: (function () {
      try { return parseInt(sessionStorage.getItem('akirma_admin_exp') || '0', 10) || 0; } catch (e) { return 0; }
    })(),
    loginAt: 0,
    available: !!cfg.SERVER_API,
  };

  if (!SERVER.available) {
    console.warn('AkirmaStore: SERVER_API is disabled in js/config.js — form submissions and the admin dashboard have nowhere to store data.');
  }

  /** Small fetch wrapper for the site API. Throws on any failure.
   *  Sends the session token when we have one; opts.public skips it
   *  (login itself). A 401 with a brand-new session is retried once to
   *  cover cross-colo KV propagation, then the dead token is cleared
   *  and the dashboard is notified via `akirma:admin-401`. */
  async function apiOnce(path, opts) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (SERVER.token && !opts.public) headers['Authorization'] = 'Bearer ' + SERVER.token;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON */ }
    return { res, data };
  }

  async function api(path, opts = {}) {
    if (!SERVER.available) throw new Error('Site API is disabled (SERVER_API: false in js/config.js).');
    let { res, data } = await apiOnce(path, opts);
    if (res.status === 401 && !opts.public && SERVER.token &&
        SERVER.loginAt && (Date.now() - SERVER.loginAt) < 90000) {
      await new Promise(r => setTimeout(r, 2000)); // cover KV propagation lag
      ({ res, data } = await apiOnce(path, opts));
    }
    if (res.status === 401 && !opts.public) clearSession(true);
    if (!res.ok || !data || data.ok !== true) {
      const err = new Error((data && data.error) || ('HTTP ' + res.status));
      err.status = res && res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function clearSession(expired) {
    SERVER.token = '';
    SERVER.expiresAt = 0;
    try {
      sessionStorage.removeItem('akirma_admin_token');
      sessionStorage.removeItem('akirma_admin_exp');
    } catch (e) { /* ignore */ }
    if (expired) {
      try { window.dispatchEvent(new CustomEvent('akirma:admin-401')); } catch (e) { /* ignore */ }
    }
  }

  /* ── PUBLIC API ───────────────────────────────────────── */
  const store = { mode: 'server' };

  /** Admin dashboard: exchange the password for a server-side session token.
   *  The password is verified by the Worker (constant-time compare against
   *  a PBKDF2 hash, brute-force locked); only the random token is kept, in
   *  sessionStorage. */
  store.adminLogin = async function (password) {
    const d = await api('/api/admin/login', {
      method: 'POST', public: true, body: JSON.stringify({ password: String(password || '') }),
    });
    SERVER.token = String(d.token || '');
    SERVER.expiresAt = Date.now() + (parseInt(d.expires_in, 10) || 0) * 1000;
    SERVER.loginAt = Date.now();
    try {
      sessionStorage.setItem('akirma_admin_token', SERVER.token);
      sessionStorage.setItem('akirma_admin_exp', String(SERVER.expiresAt));
    } catch (e) { /* ignore */ }
    return true;
  };

  /** Invalidate the session server-side and forget it locally. */
  store.adminLogout = async function () {
    try { await api('/api/admin/logout', { method: 'POST', public: true }); } catch (e) { /* best effort */ }
    clearSession(false);
  };

  /** Ask the Worker to email a single-use password reset link to the owner
   *  inbox (NOTIFY_EMAIL). Always resolves ok:true unless rate-limited. */
  store.forgotPassword = function () {
    return api('/api/admin/forgot-password', { method: 'POST', public: true, body: '{}' });
  };

  /** Exchange a reset token for a new password (single use, 15-minute
   *  window). The Worker stores only a PBKDF2 hash and kills all sessions. */
  store.resetPassword = function (token, password) {
    return api('/api/admin/reset-password', {
      method: 'POST', public: true, body: JSON.stringify({ token, password }),
    });
  };

  /** Change the password from inside the dashboard (requires the current
   *  one). Keeps the current session alive; other sessions are signed out. */
  store.changePassword = function (current, next) {
    return api('/api/admin/change-password', {
      method: 'POST', body: JSON.stringify({ current, next }),
    });
  };

  /** True when a non-expired session token exists (used at boot). */
  store.adminSessionActive = function () {
    return !!(SERVER.token && (!SERVER.expiresAt || SERVER.expiresAt > Date.now()));
  };

  /** Save a contact-form/booking inquiry. Rejects on failure so the
   *  contact form can show an honest error (no silent data loss). */
  store.saveInquiry = function (data) {
    const rec = Object.assign({ status: 'new', createdAt: Date.now(), source: 'contact_form' }, data);
    return api('/api/inquiry', { method: 'POST', body: JSON.stringify(rec) });
  };

  /** Save a newsletter signup. The Worker dedupes by normalized email
   *  and answers `duplicate: true` (still a success) for repeats. */
  store.saveSubscriber = function (email) {
    const rec = { email: String(email || '').trim(), source: 'newsletter_footer' };
    return api('/api/subscriber', { method: 'POST', body: JSON.stringify(rec) });
  };

  /* ── ADMIN data access (used by admin.js) ─────────────── */

  /** Fetch inquiries. Resolves [{id, ...rec}] sorted newest first. */
  store.getInquiries = async function () {
    const d = await api('/api/inquiries');
    return d.items || [];
  };

  /** Fetch subscribers. Resolves [{id, email, createdAt}] newest first. */
  store.getSubscribers = async function () {
    const d = await api('/api/subscribers');
    return d.items || [];
  };

  /** Update an inquiry (e.g. {status: 'read' | 'replied'}). */
  store.updateInquiry = async function (id, patch) {
    await api('/api/inquiry', { method: 'PATCH', body: JSON.stringify({ id, patch }) });
  };

  store.deleteInquiry = async function (id) {
    await api('/api/inquiry', { method: 'DELETE', body: JSON.stringify({ id }) });
  };

  store.deleteSubscriber = async function (id) {
    await api('/api/subscriber', { method: 'DELETE', body: JSON.stringify({ id }) });
  };

  /* ── EMAIL ALERT diagnostics (Settings tab) ───────────── */

  /** Alert configuration for the admin Settings card. */
  store.getNotifyStatus = async function () {
    return api('/api/notify-status');
  };

  /** Ask the Worker to send a test alert. Resolves the full result payload
   *  ({ok:true,to,detail} or {ok:false,error,detail}) — a failed send is a
   *  result to display, not an exception. */
  store.sendNotifyTest = async function () {
    const { res, data } = await apiOnce('/api/notify-test', { method: 'POST', body: '{}' });
    if (!res.ok || !data) {
      const err = new Error((data && data.error) || ('HTTP ' + res.status));
      err.data = data;
      throw err;
    }
    return data;
  };

  window.AkirmaStore = store;
})();
