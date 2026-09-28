/**
 * AKIRMA EVENTS - js/admin.js
 * Admin dashboard logic. Requires config.js + store.js.
 *
 * Two modes (auto-detected from js/config.js):
 *  - firebase : sign-in with Firebase Auth email/password, data from Firestore
 *  - demo     : PIN gate (ADMIN.DEMO_PIN), sample data in localStorage
 *
 * All admin UI text is English-only (back-office tool).
 */
(function () {
  'use strict';

  const S = window.AkirmaStore;
  const cfg = window.AKIRMA_CONFIG || {};
  const fbReady = S && S.isConfigured();

  /* ── STATE ── */
  const state = {
    view: 'overview',
    inquiries: [],
    subscribers: [],
    filter: 'all',
    loaded: false,
  };

  /* ── SHORT HELPERS ── */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '?').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();
  }
  function fmtWhen(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const diff = Date.now() - ts;
    const day = 86400000;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < day) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 7 * day) return Math.floor(diff / day) + 'd ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  const ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>',
  };

  /* ── AUTH / BOOT ── */
  function showLogin() {
    $('admin-login').style.display = 'flex';
    $('admin-app').style.display = 'none';
    $('login-form-fb').style.display = fbReady ? 'flex' : 'none';
    $('login-form-demo').style.display = fbReady ? 'none' : 'flex';
    $('login-sub').textContent = fbReady
      ? 'Sign in with your admin account to manage inquiries & subscribers.'
      : 'Preview the dashboard with sample data.';
  }
  function showApp() {
    $('admin-login').style.display = 'none';
    $('admin-app').style.display = 'flex';
    $('mode-chip').textContent = fbReady ? 'LIVE · FIREBASE' : 'DEMO DATA';
    $('mode-chip').classList.toggle('live', fbReady);
    refreshData();
  }

  async function boot() {
    // Restore demo session
    if (!fbReady) {
      if (sessionStorage.getItem('akirma_admin_ok') === '1') showApp();
      else showLogin();
      return;
    }
    // Firebase: wait for auth state
    $('login-form-fb').style.display = 'flex';
    $('login-form-demo').style.display = 'none';
    S.onAuth((user) => { if (user) showApp(); else showLogin(); });
  }

  function loginError(msg) {
    const el = $('login-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  $('login-form-fb').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('login-error').style.display = 'none';
    const btn = $('admin-login-btn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await S.signIn($('admin-email').value.trim(), $('admin-pass').value);
      // onAuth callback flips the view
    } catch (err) {
      loginError(err && err.code === 'auth/invalid-credential'
        ? 'Wrong email or password.'
        : 'Sign-in failed: ' + (err.message || 'unknown error'));
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  $('login-form-demo').addEventListener('submit', (e) => {
    e.preventDefault();
    $('login-error').style.display = 'none';
    const pin = ($('admin-pin').value || '').trim();
    if (pin === String(cfg.ADMIN && cfg.ADMIN.DEMO_PIN || '2519')) {
      sessionStorage.setItem('akirma_admin_ok', '1');
      showApp();
    } else {
      loginError('Incorrect PIN. The default demo PIN is in js/config.js (ADMIN.DEMO_PIN).');
    }
  });

  $('btn-logout').addEventListener('click', async () => {
    await S.signOut();
    sessionStorage.removeItem('akirma_admin_ok');
    showLogin();
  });

  /* ── DATA ── */
  async function refreshData() {
    try {
      const [inq, subs] = await Promise.all([S.getInquiries(), S.getSubscribers()]);
      state.inquiries = inq || [];
      state.subscribers = subs || [];
      state.loaded = true;
    } catch (err) {
      console.error('Failed to load admin data:', err);
      state.loaded = true;
      state.loadError = (err && err.message) || 'Failed to load data.';
    }
    renderBadge();
    render();
  }
  $('btn-refresh').addEventListener('click', () => { refreshData(); });

  function renderBadge() {
    const n = state.inquiries.filter(i => (i.status || 'new') === 'new').length;
    const b = $('badge-new');
    if (n > 0) { b.textContent = n; b.style.display = 'inline-flex'; }
    else b.style.display = 'none';
  }

  /* ── CSV ── */
  function toCSV(rows, fields) {
    const head = fields.join(',');
    const body = rows.map(r => fields.map(f => {
      let v = r[f];
      if (f === 'createdAt') v = v ? new Date(v).toISOString() : '';
      v = String(v == null ? '' : v).replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    }).join(',')).join('\n');
    return head + '\n' + body;
  }
  function downloadCSV(name, rows, fields) {
    const blob = new Blob([toCSV(rows, fields)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ── NAV ── */
  const TITLES = { overview: 'Overview', inquiries: 'Inquiries', subscribers: 'Newsletter Subscribers', settings: 'Settings' };
  document.querySelectorAll('.sb-link[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      document.querySelectorAll('.sb-link[data-view]').forEach(b => b.classList.toggle('active', b === btn));
      $('topbar-title').textContent = TITLES[state.view];
      closeSidebar();
      render();
    });
  });
  $('sb-burger').addEventListener('click', () => {
    $('admin-sidebar').classList.add('open');
    $('sb-scrim').classList.add('show');
  });
  function closeSidebar() {
    $('admin-sidebar').classList.remove('open');
    $('sb-scrim').classList.remove('show');
  }
  $('sb-scrim').addEventListener('click', closeSidebar);

  /* ── THEME ── */
  const themeBtn = $('btn-theme');
  if (localStorage.getItem('admin_theme') === 'dark') document.body.classList.add('dark');
  themeBtn.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('admin_theme', dark ? 'dark' : 'light');
  });

  /* ── RENDER ── */
  function render() {
    const c = $('admin-content');
    if (state.loadError) {
      c.innerHTML = `<div class="panel"><div class="empty-state">${ICONS.inbox}<p><strong>Could not load data.</strong><br>${esc(state.loadError)}</p><p style="margin-top:.5rem;font-size:.8rem">If this says "Missing or insufficient permissions", check the Firestore rules from the setup guide in Settings.</p></div></div>`;
      return;
    }
    if (state.view === 'overview') return renderOverview(c);
    if (state.view === 'inquiries') return renderInquiries(c);
    if (state.view === 'subscribers') return renderSubscribers(c);
    if (state.view === 'settings') return renderSettings(c);
  }

  function statCard(icon, label, value, cls) {
    return `<div class="stat-box"><span class="k">${icon} ${label}</span><span class="v ${cls || ''}">${value}</span></div>`;
  }

  function renderOverview(c) {
    const inq = state.inquiries;
    const week = inq.filter(i => i.createdAt && (Date.now() - i.createdAt) < 7 * 86400000).length;
    const unread = inq.filter(i => (i.status || 'new') === 'new').length;

    const byType = {};
    inq.forEach(i => { const t = i.event_type || 'Other'; byType[t] = (byType[t] || 0) + 1; });
    const types = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = Math.max(1, inq.length);

    const recent = inq.slice(0, 5).map(rowHTML).join('');

    c.innerHTML = `
      <div class="stats-grid">
        ${statCard(ICONS.inbox, 'Total Inquiries', inq.length)}
        ${statCard(ICONS.mail, 'New / Unread', unread, 'gold')}
        ${statCard(ICONS.clock, 'This Week', week)}
        ${statCard(ICONS.users, 'Subscribers', state.subscribers.length)}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Inquiries by Event Type</h3>
          <div class="actions"><button class="mini-btn" data-goto="inquiries">View all &rarr;</button></div>
        </div>
        ${types.length ? types.map(([t, n]) => `
          <div class="type-bar-row">
            <span class="lbl">${esc(t)}</span>
            <div class="type-bar-track"><div class="type-bar-fill" style="width:${Math.max(6, Math.round(n / total * 100))}%"></div></div>
            <span class="n">${n}</span>
          </div>`).join('')
        : '<div class="empty-state"><p>No inquiries yet.</p></div>'}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Recent Inquiries</h3>
          <div class="actions"><button class="mini-btn" data-goto="inquiries">Open inbox &rarr;</button></div>
        </div>
        <div class="inquiry-list">${recent || '<div class="empty-state"><p>No inquiries yet — they will appear here as visitors submit the contact form.</p></div>'}</div>
      </div>`;

    c.querySelectorAll('[data-goto]').forEach(b =>
      b.addEventListener('click', () => {
        document.querySelector(`.sb-link[data-view="${b.dataset.goto}"]`).click();
      }));
    bindRows(c);
  }

  function statusBadge(s) {
    const map = { new: 'New', read: 'Read', replied: 'Replied' };
    const label = map[s] || 'New';
    return `<span class="status-badge status-${esc(s || 'new')}">${label}</span>`;
  }

  function rowHTML(i) {
    const st = i.status || 'new';
    return `
      <button class="inquiry-row ${st === 'new' ? 'unread' : ''}" data-id="${esc(i.id)}">
        <span class="avatar">${esc(initials(i.name))}</span>
        <span class="inquiry-main">
          <span class="name">${esc(i.name || 'Unknown')} <span class="type-chip">${esc(i.event_type || 'General')}</span></span>
          <span class="msg">${esc(i.message || 'No message').slice(0, 90)}</span>
        </span>
        <span class="inquiry-side">
          <span class="when">${fmtWhen(i.createdAt)}</span>
          ${statusBadge(st)}
        </span>
      </button>`;
  }

  function renderInquiries(c) {
    const list = state.inquiries.filter(i => {
      if (state.filter === 'all') return true;
      return (i.status || 'new') === state.filter;
    });

    c.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h3>Inbox (${list.length})</h3>
          <div class="actions">
            <button class="mini-btn" id="csv-inq">${ICONS.download} Export CSV</button>
          </div>
        </div>
        <div class="filter-row">
          ${['all', 'new', 'read', 'replied'].map(f =>
            `<button class="filter-chip ${state.filter === f ? 'active' : ''}" data-filter="${f}">${f[0].toUpperCase() + f.slice(1)}${f === 'all' ? '' : 's'}</button>`).join('')}
        </div>
        <div class="inquiry-list">
          ${list.length ? list.map(rowHTML).join('')
            : `<div class="empty-state">${ICONS.inbox}<p>No inquiries here${fbReady ? '' : ' (demo data only shows in Demo mode)'}.</p></div>`}
        </div>
      </div>`;

    c.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
      state.filter = b.dataset.filter;
      render();
    }));
    $('csv-inq').addEventListener('click', () =>
      downloadCSV('akirma-inquiries.csv', list,
        ['name', 'email', 'phone', 'event_type', 'event_date', 'message', 'status', 'createdAt']));
    bindRows(c);
  }

  function bindRows(scope) {
    scope.querySelectorAll('.inquiry-row[data-id]').forEach(row => {
      row.addEventListener('click', () => openInquiry(row.dataset.id));
    });
  }

  /* ── DRAWER ── */
  function openInquiry(id) {
    const i = state.inquiries.find(x => x.id === id);
    if (!i) return;
    const phoneDigits = String(i.phone || '').replace(/[^0-9]/g, '');
    const wa = phoneDigits ? `https://wa.me/${phoneDigits.replace(/^0+/, '251').slice(0, 13)}?text=${encodeURIComponent('Hello ' + (i.name || '') + ', thank you for contacting Akirma Events!')}` : '';
    const mailto = i.email ? `mailto:${i.email}?subject=${encodeURIComponent('Re: Your event inquiry — Akirma Events')}` : '';

    $('drawer-body').innerHTML = `
      <div class="d-row"><span class="lbl">Status</span>
        <span class="val">${statusBadge(i.status || 'new')}</span>
      </div>
      <div class="d-row"><span class="lbl">Name</span><span class="val">${esc(i.name || '—')}</span></div>
      <div class="d-row"><span class="lbl">Email</span><span class="val">${i.email ? `<a href="${mailto}">${esc(i.email)}</a>` : '—'}</span></div>
      <div class="d-row"><span class="lbl">Phone</span><span class="val">${i.phone ? `<a href="tel:${esc(String(i.phone).replace(/\s/g, ''))}">${esc(i.phone)}</a>` : '—'}</span></div>
      <div class="d-row"><span class="lbl">Event Type</span><span class="val">${esc(i.event_type || '—')}</span></div>
      <div class="d-row"><span class="lbl">Event Date</span><span class="val">${esc(i.event_date || 'Flexible / not set')}</span></div>
      <div class="d-row"><span class="lbl">Received</span><span class="val">${fmtDate(i.createdAt)}</span></div>
      <div class="d-row"><span class="lbl">Message</span><span class="val">${esc(i.message || '—')}</span></div>
      <div class="d-actions">
        <button class="mini-btn primary" data-act="read">Mark as Read</button>
        <button class="mini-btn" data-act="replied">Mark as Replied</button>
        ${wa ? `<a class="mini-btn" target="_blank" rel="noopener" href="${wa}">${ICONS.wa} Reply on WhatsApp</a>` : ''}
        <button class="mini-btn danger" data-act="delete">${ICONS.trash} Delete</button>
      </div>`;

    $('drawer-body').querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const act = btn.dataset.act;
        if (act === 'delete') {
          if (!confirm('Delete this inquiry permanently?')) return;
          await S.deleteInquiry(id);
        } else {
          await S.updateInquiry(id, { status: act });
        }
        closeDrawer();
        refreshData();
      });
    });

    $('inquiry-drawer').classList.add('open');
    $('inquiry-drawer').setAttribute('aria-hidden', 'false');
    $('drawer-scrim').classList.add('show');
    // auto-mark as read when opened (fire-and-forget)
    if ((i.status || 'new') === 'new') {
      S.updateInquiry(id, { status: 'read' })
        .then(() => { i.status = 'read'; renderBadge(); })
        .catch(() => {});
    }
  }
  function closeDrawer() {
    $('inquiry-drawer').classList.remove('open');
    $('inquiry-drawer').setAttribute('aria-hidden', 'true');
    $('drawer-scrim').classList.remove('show');
  }
  $('drawer-close').addEventListener('click', closeDrawer);
  $('drawer-scrim').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ── SUBSCRIBERS ── */
  function renderSubscribers(c) {
    c.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h3>Newsletter Subscribers (${state.subscribers.length})</h3>
          <div class="actions">
            <button class="mini-btn" id="csv-subs">${ICONS.download} Export CSV</button>
          </div>
        </div>
        <div>
          ${state.subscribers.length ? state.subscribers.map(s => `
            <div class="sub-row">
              <span class="avatar" style="width:2.25rem;height:2.25rem;font-size:.75rem">${esc(initials(s.email.split('@')[0]))}</span>
              <span class="email">${esc(s.email)}</span>
              <span class="when">${fmtWhen(s.createdAt)}</span>
              <button class="mini-btn danger" data-del="${esc(s.id)}" title="Remove subscriber">${ICONS.trash}</button>
            </div>`).join('')
            : `<div class="empty-state"><p>No subscribers yet. Visitors who join the newsletter in the footer will be listed here.</p></div>`}
        </div>
      </div>`;
    $('csv-subs').addEventListener('click', () =>
      downloadCSV('akirma-subscribers.csv', state.subscribers, ['email', 'createdAt']));
    c.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Remove this subscriber?')) return;
      await S.deleteSubscriber(b.dataset.del);
      refreshData();
    }));
  }

  /* ── SETTINGS ── */
  function renderSettings(c) {
    const emailJsOn = cfg.EMAILJS && !/^YOUR_/.test(cfg.EMAILJS.SERVICE_ID || 'YOUR_');
    c.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h3>Integration Status</h3></div>
        <div class="conn-grid">
          <div class="conn-item">
            <span class="conn-dot ${fbReady ? 'on' : 'off'}"></span>
            <div><div class="t">Firebase (dashboard data)</div>
            <div class="s">${fbReady ? 'Connected — inquiries & subscribers are stored in Firestore.' : 'Not connected — running in demo mode.'}</div></div>
          </div>
          <div class="conn-item">
            <span class="conn-dot ${emailJsOn ? 'on' : 'off'}"></span>
            <div><div class="t">EmailJS (email delivery)</div>
            <div class="s">${emailJsOn ? 'Connected — forms send real email.' : 'Not connected — contact form falls back to WhatsApp.'}</div></div>
          </div>
        </div>
      </div>

      ${fbReady ? '' : `
      <div class="panel">
        <div class="panel-head"><h3>Connect Firebase — Step by Step</h3></div>
        <div class="setup-step"><span class="step-num">1</span><div><h4>Create a Firebase project</h4>
          <p>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener">console.firebase.google.com</a>, click <code>Add project</code> and follow the wizard (Analytics optional).</p></div></div>
        <div class="setup-step"><span class="step-num">2</span><div><h4>Create the Firestore database</h4>
          <p>Build &rarr; <code>Firestore Database</code> &rarr; Create database (choose production mode, nearest region).</p></div></div>
        <div class="setup-step"><span class="step-num">3</span><div><h4>Create the admin user</h4>
          <p>Build &rarr; <code>Authentication</code> &rarr; Sign-in method &rarr; enable <code>Email/Password</code>. Then Users &rarr; Add user — e.g. <code>admin@akirma.com</code> with a strong password. Use these to sign in on this page.</p></div></div>
        <div class="setup-step"><span class="step-num">4</span><div><h4>Copy the web app config</h4>
          <p>Project settings (gear) &rarr; General &rarr; Your apps &rarr; Web app (<code>&lt;/&gt;</code>) &rarr; copy the <code>firebaseConfig</code> values into <code>js/config.js &rarr; FIREBASE</code>.</p></div></div>
        <div class="setup-step"><span class="step-num">5</span><div><h4>Paste the security rules</h4>
          <p>Firestore &rarr; Rules &rarr; paste the rules printed at the top of <code>js/config.js</code> &rarr; Publish. Visitors can only <em>create</em> inquiries; only your signed-in admin can read or manage them.</p>
          <pre>rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inquiries/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /subscribers/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}</pre></div></div>
        <div class="setup-step"><span class="step-num">6</span><div><h4>Redeploy & sign in</h4>
          <p>Push the updated <code>js/config.js</code> live, open <code>/admin.html</code>, sign in with the email/password from step 3 — the dashboard switches from DEMO to LIVE automatically.</p></div></div>
      </div>`}

      <div class="panel">
        <div class="panel-head"><h3>Security Notes</h3></div>
        <div class="setup-step"><span class="step-num">•</span><div><h4>How access is protected</h4>
          <p><strong>Live mode:</strong> sign-in is handled by Firebase Authentication; data access is locked by the Firestore rules above. <strong>Demo mode:</strong> the PIN (<code>ADMIN.DEMO_PIN</code> in <code>js/config.js</code>) only gates a local preview with sample data — change it to any 4+ digit value you like.</p></div></div>
        <div class="setup-step"><span class="step-num">•</span><div><h4>Privacy</h4>
          <p>Inquiries contain personal data (names, phones, emails). Access is limited to the admin account; export CSVs only when needed and delete stale records.</p></div></div>
        <div class="setup-step"><span class="step-num">•</span><div><h4>This page is hidden from search engines</h4>
          <p><code>admin.html</code> has a noindex meta tag and is disallowed in <code>robots.txt</code>.</p></div></div>
      </div>`;
  }

  /* ── GO ── */
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
