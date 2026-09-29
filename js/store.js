/**
 * AKIRMA EVENTS - js/store.js
 * Lightweight data layer for the admin dashboard.
 *
 * - Reads window.AKIRMA_CONFIG.FIREBASE. When the placeholders are replaced
 *   with a real project config, it lazily loads the Firebase compat SDK and
 *   exposes Firestore + Auth helpers.
 * - While unconfigured it runs in DEMO mode: data lives in localStorage so the
 *   dashboard can be previewed with sample records. Nothing is sent anywhere.
 *
 * Public site usage (fire-and-forget, never blocks or breaks the UI):
 *   AkirmaStore.saveInquiry({ ... })     // contact form
 *   AkirmaStore.saveSubscriber(email)    // newsletter
 */
(function () {
  'use strict';

  const cfg = (window.AKIRMA_CONFIG || {});
  const fb = cfg.FIREBASE || {};
  const admin = cfg.ADMIN || {};

  const DEMO_KEY_I = 'akirma_demo_inquiries';
  const DEMO_KEY_S = 'akirma_demo_subscribers';

  const isConfigured = () =>
    fb.apiKey && !/^YOUR_/.test(fb.apiKey) &&
    fb.projectId && !/^YOUR_/.test(fb.projectId);

  /* ── SITE API mode (Cloudflare Worker + KV, see worker.js) ── */
  const SERVER = {
    pin: (function () {
      try { return sessionStorage.getItem('akirma_admin_pin') || ''; } catch (e) { return ''; }
    })(),
    available: !!cfg.SERVER_API,
  };
  const useServer = () => !isConfigured() && SERVER.available;

  /** Small fetch wrapper for the site API. Throws on any failure. */
  async function api(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (SERVER.pin) headers['X-Admin-PIN'] = SERVER.pin;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON */ }
    if (!res.ok || !data || data.ok !== true) {
      const err = new Error((data && data.error) || ('HTTP ' + res.status));
      err.status = res && res.status;
      throw err;
    }
    return data;
  }

  let ready = false;        // firebase loaded & initialized
  let loading = null;       // promise while loading SDK
  let db = null;
  let auth = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  /** Load the Firebase compat SDK and initialize. Returns {db, auth} or null. */
  function init() {
    if (ready) return Promise.resolve({ db, auth });
    if (!isConfigured()) return Promise.resolve(null);
    if (loading) return loading;
    loading = (async () => {
      const V = '10.14.1';
      await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore-compat.js`);
      firebase.initializeApp(fb);
      db = firebase.firestore();
      auth = firebase.auth();
      // persist session across reloads (default) — keep it explicit
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      ready = true;
      return { db, auth };
    })().catch(err => {
      console.error('Firebase init failed:', err);
      loading = null;
      return null;
    });
    return loading;
  }

  /* ── DEMO MODE helpers (localStorage) ─────────────────── */
  function demoInquiries() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY_I) || 'null'); } catch (e) { return null; }
  }
  function seedDemo() {
    const day = 86400000;
    const now = Date.now();
    const data = [
      { id: 'd1', name: 'Selam Bekele', email: 'selam.b@gmail.com', phone: '+251 911 234 567', event_type: 'Wedding', event_date: '2026-11-14', message: 'Hi! We are planning a Habesha wedding for around 300 guests in November. Could you share package options for decor and catering?', status: 'new', createdAt: now - 0.2 * day, source: 'contact_form' },
      { id: 'd2', name: 'Daniel Girma', email: 'daniel@zemenbank.et', phone: '+251 930 111 222', event_type: 'Corporate Event', event_date: '2026-10-30', message: 'We need a year-end staff celebration for 450 people at our headquarters. Please include sound and LED screen rental.', status: 'read', createdAt: now - 1.1 * day, source: 'contact_form' },
      { id: 'd3', name: 'Marta Alemu', email: 'marta.alemu@yahoo.com', phone: '+251 914 555 888', event_type: 'Birthday Party', event_date: '', message: 'My daughter turns 7 next month, looking for kids party ideas and decoration.', status: 'replied', createdAt: now - 2.4 * day, source: 'contact_form' },
      { id: 'd4', name: 'Office of the Mayor', email: 'events@city.gov.et', phone: '+251 115 555 000', event_type: 'Government Event', event_date: '2026-12-05', message: 'Requesting a proposal for a public ceremony expected to host over 5,000 attendees, including stage and tent setup.', status: 'new', createdAt: now - 3.6 * day, source: 'contact_form' },
      { id: 'd5', name: 'Yonas Tesfaye', email: 'yonas.t@gmail.com', phone: '+251 921 777 999', event_type: 'Concert / Festival', event_date: '', message: 'Organizing a small music festival in Hawassa. Do you provide sound engineering outside Addis?', status: 'read', createdAt: now - 5.2 * day, source: 'contact_form' },
      { id: 'd6', name: 'Hanna Wolde', email: 'hanna.w@outlook.com', phone: '+251 911 345 678', event_type: 'Graduation Ceremony', event_date: '2026-07-08', message: 'Graduation party for 120 guests, thinking of the Premium package. What is included?', status: 'replied', createdAt: now - 6.9 * day, source: 'contact_form' },
      { id: 'd7', name: 'Fikir Media PLC', email: 'hello@fikirmedia.com', phone: '+251 944 222 333', event_type: 'Other', event_date: '', message: 'We would like a partnership discussion about photo and video services for our clients.', status: 'read', createdAt: now - 8.1 * day, source: 'contact_form' },
      { id: 'd8', name: 'Bekele Haile', email: 'bekele.h@gmail.com', phone: '+251 912 888 444', event_type: 'Cultural / Religious', event_date: '2027-01-19', message: 'Planning Timket celebration logistics for our church community, roughly 800 people.', status: 'new', createdAt: now - 9.5 * day, source: 'contact_form' },
    ];
    localStorage.setItem(DEMO_KEY_I, JSON.stringify(data));
    localStorage.setItem(DEMO_KEY_S, JSON.stringify([
      { id: 's1', email: 'selam.b@gmail.com', createdAt: now - 0.5 * day },
      { id: 's2', email: 'daniel@zemenbank.et', createdAt: now - 1.3 * day },
      { id: 's3', email: 'weddings.et@gmail.com', createdAt: now - 2.9 * day },
      { id: 's4', email: 'yonas.t@gmail.com', createdAt: now - 4.4 * day },
      { id: 's5', email: 'abebe.kebede@gmail.com', createdAt: now - 6.7 * day },
      { id: 's6', email: 'liya.events@gmail.com', createdAt: now - 7.8 * day },
      { id: 's7', email: 'hanna.w@outlook.com', createdAt: now - 9.2 * day },
    ]));
    return data;
  }
  function demoSubscribers() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(DEMO_KEY_S) || 'null'); } catch (e) {}
    if (!v) { seedDemo(); v = JSON.parse(localStorage.getItem(DEMO_KEY_S)); }
    return v;
  }

  /* ── PUBLIC API ───────────────────────────────────────── */
  const store = {
    mode: isConfigured() ? 'firebase' : (SERVER.available ? 'server' : 'demo'),
    init, isConfigured,
  };

  /** Admin dashboard: remember the PIN for site-API calls (server mode). */
  store.setAdminPin = function (pin) {
    SERVER.pin = String(pin || '');
    try { sessionStorage.setItem('akirma_admin_pin', SERVER.pin); } catch (e) { /* ignore */ }
  };

  /** Fire-and-forget save of a contact-form inquiry. */
  store.saveInquiry = function (data) {
    const rec = Object.assign({ status: 'new', createdAt: Date.now(), source: 'contact_form' }, data);
    // Preferred path: deliver the inquiry to the admin via the site API (Worker + KV).
    // Rejects on failure so the contact form can show an honest error message.
    if (useServer()) {
      return api('/api/inquiry', { method: 'POST', body: JSON.stringify(rec) });
    }
    if (!isConfigured()) {
      try {
        const list = demoInquiries() || seedDemo();
        rec.id = 'd' + Date.now();
        list.unshift(rec);
        localStorage.setItem(DEMO_KEY_I, JSON.stringify(list.slice(0, 200)));
      } catch (e) { /* storage full / private mode — ignore */ }
      return Promise.resolve();
    }
    return init().then(r => r && r.db
      .collection(admin.INQUIRIES_COLLECTION || 'inquiries')
      .add(rec))
      .catch(err => console.warn('Inquiry store skipped:', err.message));
  };

  /** Fire-and-forget save of a newsletter subscriber. */
  store.saveSubscriber = function (email) {
    const rec = { email, createdAt: Date.now(), source: 'newsletter_footer' };
    if (!isConfigured()) {
      try {
        const list = demoSubscribers();
        if (!list.some(x => x.email === email)) {
          rec.id = 's' + Date.now();
          list.push(rec);
          localStorage.setItem(DEMO_KEY_S, JSON.stringify(list.slice(0, 500)));
        }
      } catch (e) { /* ignore */ }
      return Promise.resolve();
    }
    return init().then(r => r && r.db
      .collection(admin.SUBSCRIBERS_COLLECTION || 'subscribers')
      .add(rec))
      .catch(err => console.warn('Subscriber store skipped:', err.message));
  };

  /* ── ADMIN data access (used by admin.js) ─────────────── */

  /** Sign in with email/password (Firebase mode). Returns user or throws. */
  store.signIn = async function (email, password) {
    const r = await init();
    if (!r) throw new Error('Firebase is not configured');
    const cred = await r.auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  };

  store.signOut = async function () {
    if (ready && auth) await auth.signOut();
    sessionStorage.removeItem('akirma_admin_ok');
  };

  store.onAuth = function (cb) {
    if (!isConfigured()) { cb(null); return () => {}; }
    return init().then(r => {
      if (!r) { cb(null); return () => {}; }
      r.auth.onAuthStateChanged(u => cb(u));
    });
  };

  /** Fetch inquiries. Resolves [{id, ...rec}] sorted newest first. */
  store.getInquiries = async function () {
    if (useServer()) {
      const d = await api('/api/inquiries');
      return d.items || [];
    }
    if (!isConfigured()) {
      return (demoInquiries() || seedDemo()).slice().sort((a, b) => b.createdAt - a.createdAt);
    }
    const r = await init();
    const snap = await r.db.collection(admin.INQUIRIES_COLLECTION || 'inquiries')
      .orderBy('createdAt', 'desc').limit(500).get();
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  };

  /** Fetch subscribers. Resolves [{id, email, createdAt}] newest first. */
  store.getSubscribers = async function () {
    if (!isConfigured()) {
      return demoSubscribers().slice().sort((a, b) => b.createdAt - a.createdAt);
    }
    const r = await init();
    const snap = await r.db.collection(admin.SUBSCRIBERS_COLLECTION || 'subscribers')
      .orderBy('createdAt', 'desc').limit(1000).get();
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  };

  store.updateInquiry = async function (id, patch) {
    if (useServer()) {
      await api('/api/inquiry', { method: 'PATCH', body: JSON.stringify({ id, patch }) });
      return;
    }
    if (!isConfigured()) {
      const list = demoInquiries() || seedDemo();
      const i = list.findIndex(x => x.id === id);
      if (i >= 0) { list[i] = Object.assign(list[i], patch); localStorage.setItem(DEMO_KEY_I, JSON.stringify(list)); }
      return;
    }
    const r = await init();
    return r.db.collection(admin.INQUIRIES_COLLECTION || 'inquiries').doc(id).update(patch);
  };

  store.deleteInquiry = async function (id) {
    if (useServer()) {
      await api('/api/inquiry', { method: 'DELETE', body: JSON.stringify({ id }) });
      return;
    }
    if (!isConfigured()) {
      const list = demoInquiries() || seedDemo();
      localStorage.setItem(DEMO_KEY_I, JSON.stringify(list.filter(x => x.id !== id)));
      return;
    }
    const r = await init();
    return r.db.collection(admin.INQUIRIES_COLLECTION || 'inquiries').doc(id).delete();
  };

  store.deleteSubscriber = async function (id) {
    if (!isConfigured()) {
      const list = demoSubscribers();
      localStorage.setItem(DEMO_KEY_S, JSON.stringify(list.filter(x => x.id !== id)));
      return;
    }
    const r = await init();
    return r.db.collection(admin.SUBSCRIBERS_COLLECTION || 'subscribers').doc(id).delete();
  };

  window.AkirmaStore = store;
})();
