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
    updateContentBadge();
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
  const TITLES = { overview: 'Overview', inquiries: 'Inquiries', subscribers: 'Newsletter Subscribers', content: 'Website Content', settings: 'Settings' };
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
    if (state.view === 'content') return renderContent(c);
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

  /* ══ CONTENT EDITOR (landing page) ══════════════════════
     Edits the dynamic content of index.html through js/content.js:
     - "Save & Preview" writes overrides to localStorage → visible on the
       site in THIS browser immediately.
     - "Copy publish snippet" produces the exact content for
       js/site-overrides.js → commit it to publish for EVERY visitor.   */
  const C = window.AkirmaContent;

  const C_TABS = [
    ['hero', 'Hero'], ['sections', 'Sections'], ['services', 'Services (12)'],
    ['events', 'Events (17)'], ['blog', 'Blog'], ['testimonials', 'Testimonials'], ['faq', 'FAQ'],
    ['identity', 'Vision & Mission'], ['why', 'Why Choose Us'], ['contact', 'Contact Info'], ['seo', 'SEO']
  ];

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }

  function ensureContentState() {
    if (!C) return;
    if (!state.content) {
      state.content = C.effective();
      state.contentTab = state.contentTab || 'hero';
      state.contentSaved = JSON.stringify(C.stored() || {});
    }
  }
  function contentOverridesJson() {
    return C ? JSON.stringify(C.diffFromDefaults(state.content)) : '{}';
  }
  function contentDirty() { return contentOverridesJson() !== state.contentSaved; }

  function updateContentBadge() {
    const b = $('badge-content');
    if (!b || !C) return;
    const has = C.stored() && Object.keys(C.stored()).length > 0;
    b.style.display = has ? 'inline-flex' : 'none';
  }

  /* ── field builders (value comes from state.content at render time) ── */
  function setCountText(el, n) {
    const max = Number(el.dataset.countMax) || 160;
    el.textContent = n + '/' + max;
    el.classList.toggle('over', n > max);
    el.classList.toggle('near', n > max - 15 && n <= max);
  }
  function updateCountFor(path) {
    document.querySelectorAll(`[data-count-for="${path}"]`).forEach(el => {
      const v = getPath(state.content, path);
      setCountText(el, typeof v === 'string' ? v.length : 0);
    });
  }

  function cField(label, path, opts) {
    opts = opts || {};
    const v = getPath(state.content, path);
    const val = (opts.features && Array.isArray(v)) ? v.join('\n') : (v == null ? '' : String(v));
    const chip = opts.lang ? `<em class="lang-chip ${opts.lang}">${opts.lang === 'en' ? 'EN' : 'አማ'}</em>` : '';
    const cnt = opts.count ? `<em class="seo-count" data-count-for="${path}" data-count-max="${opts.count}"></em>` : '';
    const fe = opts.features ? ' data-features="1"' : '';
    const type = opts.date ? 'date' : (opts.num ? 'number' : 'text');
    const numAttr = opts.num ? ' min="1" step="1"' : '';
    const fld = opts.area
      ? `<textarea class="form-input cin" data-bind="${path}"${fe} rows="${opts.rows || 3}">${esc(val)}</textarea>`
      : `<input class="form-input cin" type="${type}"${numAttr} data-bind="${path}"${fe} value="${esc(val)}" />`;
    return `<label class="cfield"><span class="clabel">${esc(label)} ${chip}${cnt}</span>${fld}</label>`;
  }
  /** Bilingual pair. tpl uses {L} → en/am (nested T fields). */
  function cBi(label, tpl, opts) {
    return `<div class="cfield-bi">${cField(label, tpl.replace('{L}', 'en'), Object.assign({}, opts, { lang: 'en' }))}${cField(label, tpl.replace('{L}', 'am'), Object.assign({}, opts, { lang: 'am' }))}</div>`;
  }
  /** Bilingual pair for flat items (…name / …nameAm). */
  function cBiFlat(label, base, enKey, amKey, opts) {
    return `<div class="cfield-bi">${cField(label, base + '.' + enKey, Object.assign({}, opts, { lang: 'en' }))}${cField(label, base + '.' + amKey, Object.assign({}, opts, { lang: 'am' }))}</div>`;
  }
  function itemCard(summary, body, open, attrs) {
    return `<details class="item-card"${open ? ' open' : ''}${attrs ? ' ' + attrs : ''}><summary>${summary}</summary><div class="item-body">${body}</div></details>`;
  }

  /* ── photo field: path input + live thumb + upload → downscaled data URL ── */
  function cImage(label, path) {
    const v = getPath(state.content, path) || '';
    const embedded = v.lastIndexOf('data:', 0) === 0;
    const note = embedded
      ? 'Embedded photo (this-browser preview) — publish with a repo path instead'
      : 'Path inside the repo (images/events/…) or any https:// URL';
    return `<div class="cimg-edit">
      <span class="clabel">${esc(label)}</span>
      <div class="cimg-row">
        <span class="cimg-thumb"><img src="${esc(v)}" alt="" ${v ? '' : 'style="display:none"'} onerror="this.style.display='none'"></span>
        <div class="cimg-fields">
          <input class="form-input cin" data-bind="${path}" value="${esc(v)}" placeholder="images/events/photo.jpg  or  https://…" />
          <div class="cimg-actions">
            <label class="mini-btn">Upload photo<input type="file" accept="image/*" data-imgbind="${path}" hidden></label>
            <span class="cimg-note">${note}</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  /** File → downscaled JPEG data URL (keeps localStorage overrides small). */
  function downscaleImage(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxW / img.naturalWidth);
          const cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.naturalWidth * scale));
          cv.height = Math.max(1, Math.round(img.naturalHeight * scale));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(url);
          resolve(cv.toDataURL('image/jpeg', quality || 0.82));
        } catch (err) { URL.revokeObjectURL(url); reject(err); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image file')); };
      img.src = url;
    });
  }

  /* ── TABS ── */
  function tabHero() {
    const stats = [0, 1, 2, 3].map(i => `
      <div class="stat-edit-row">
        ${cField('Stat ' + (i + 1) + ' number', 'stats.values.' + i)}
        ${cField('Label', 't.en.hero.stats.labels.' + i, { lang: 'en' })}
        ${cField('Label', 't.am.hero.stats.labels.' + i, { lang: 'am' })}
      </div>`).join('');
    return `
      <div class="content-grid">
        ${cBi('Eyebrow badge', 't.{L}.hero.eyebrow')}
        ${cBi('Headline', 't.{L}.hero.headline_main', { area: true, rows: 2 })}
        ${cBi('Subheadline', 't.{L}.hero.subheadline', { area: true, rows: 3 })}
        ${cBi('Primary button', 't.{L}.hero.cta_primary')}
        ${cBi('Secondary button', 't.{L}.hero.cta_secondary')}
      </div>
      <h4 class="cgroup-title">Hero stats (the 4 glass chips)</h4>
      ${stats}`;
  }

  const C_SECTIONS = [
    { key: 'services', label: 'Services' },
    { key: 'events', label: 'Featured Events', extras: [['cta', 'Button label'], ['view_gallery', 'Image overlay label']] },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'faq', label: 'FAQ' },
    { key: 'estimator', label: 'Budget Estimator' },
    { key: 'contact', label: 'Contact' },
  ];
  function tabSections() {
    const cards = C_SECTIONS.map(s => itemCard(`${esc(s.label)} section`, `
      ${cBi('Eyebrow badge', 't.{L}.eyebrows.' + s.key)}
      ${cBi('Title', 't.{L}.' + s.key + '.title')}
      ${cBi('Description', 't.{L}.' + s.key + '.description', { area: true, rows: 2 })}
      ${(s.extras || []).map(([f, lbl]) => cBi(lbl, 't.{L}.events.' + f)).join('')}
    `)).join('');
    const gallery = itemCard('Gallery section', cBi('Eyebrow badge', 't.{L}.eyebrows.gallery'));
    return `<div class="content-cards">${cards}${gallery}</div>`;
  }

  function tabServices() {
    const ids = Object.keys(state.content.services).sort((a, b) => Number(a) - Number(b));
    return `<p class="content-hint">Shown on the landing page (first 6) and the Services page (all 12). Feature lists appear on the Services page (English only) — one item per line.</p>
      <div class="content-cards">${ids.map(id => {
        const s = state.content.services[id];
        return itemCard(`<span class="svc-i">${esc(id)}</span> ${esc(s.name)} <span class="svc-am">${esc(s.nameAm)}</span>`, `
          ${cBiFlat('Name', 'services.' + id, 'name', 'nameAm')}
          ${cBiFlat('Description', 'services.' + id, 'desc', 'descAm', { area: true, rows: 2 })}
          ${cField('Features (one per line)', 'services.' + id + '.features', { area: true, rows: 5, features: true })}
        `);
      }).join('')}</div>`;
  }

  function tabEvents() {
    const ids = Object.keys(state.content.events).sort((a, b) => Number(a) - Number(b));
    return `<p class="content-hint">Events 1–4 appear on the landing page ("Featured Events"); all 17 appear in the Gallery. Swap each event's photo below — upload from your computer (instant preview) or paste a path like <code>images/events/my-photo.jpg</code> for publishing.</p>
      <div class="content-cards">${ids.map(id => {
        const e = state.content.events[id];
        return itemCard(`<span class="svc-i">${esc(id)}</span> ${esc(e.title)}`, `
          ${cImage('Photo', 'events.' + id + '.image')}
          ${cBiFlat('Title', 'events.' + id, 'title', 'titleAm')}
          ${cBiFlat('Category', 'events.' + id, 'category', 'categoryAm')}
          ${cBiFlat('Location', 'events.' + id, 'location', 'locationAm')}
          ${cField('Year', 'events.' + id + '.year')}
        `);
      }).join('')}</div>`;
  }

  /* ── BLOG tab (edit / add / delete posts on the News & Tips page) ── */
  function blogIds() {
    const map = state.content.blog || {};
    return Object.keys(map)
      .filter(id => map[id] && typeof map[id] === 'object' && !map[id]._deleted)
      .sort((a, b) => String(map[b].date || '').localeCompare(String(map[a].date || '')) || (Number(a) - Number(b)));
  }
  function blogLiveCount() { return blogIds().length; }

  function tabBlog() {
    const defaultsBlog = (C.defaults() || {}).blog || {};
    const ids = blogIds();
    const del = Object.keys(state.content.blog || {}).filter(id => state.content.blog[id] && state.content.blog[id]._deleted);
    const cards = ids.map(id => {
      const p = state.content.blog[id];
      const isNew = !defaultsBlog[id];
      return itemCard(
        `<span class="svc-i">${esc(p.date || '—')}</span> ${esc(p.title)}${isNew ? ' <em class="lang-chip en">new</em>' : ''}`,
        `
        ${cBiFlat('Title', 'blog.' + id, 'title', 'titleAm')}
        ${cBiFlat('Excerpt (shown on the card)', 'blog.' + id, 'excerpt', 'excerptAm', { area: true, rows: 2 })}
        ${cBiFlat('Category (site filters: Wedding, Corporate, Culture, Tips)', 'blog.' + id, 'category', 'categoryAm')}
        <div class="post-meta-row">
          ${cField('Date', 'blog.' + id + '.date', { date: true })}
          ${cField('Read time (min)', 'blog.' + id + '.read_min', { num: true })}
          ${cField('URL slug (unique, e.g. my-new-post)', 'blog.' + id + '.slug')}
        </div>
        <h4 class="cgroup-title">Post SEO (optional)</h4>
        ${cField('Meta title for this post — used when the article is open', 'blog.' + id + '.seo_title', { count: 60 })}
        ${cField('Meta description for this post — leave empty to reuse the page default', 'blog.' + id + '.seo_description', { area: true, rows: 2, count: 160 })}
        ${cImage('Cover photo', 'blog.' + id + '.image')}
        ${cField('Content paragraphs (EN) — one paragraph per line', 'blog.' + id + '.content', { area: true, rows: 7, features: true })}
        ${cField('Content paragraphs (AM) — one paragraph per line', 'blog.' + id + '.contentAm', { area: true, rows: 7, features: true })}
        <div class="post-actions"><button class="mini-btn danger" data-bdel="${esc(id)}">Delete this post</button></div>
        `,
        false,
        `data-post="${esc(id)}"`
      );
    }).join('');
    const delNote = del.length
      ? `<p class="content-hint deleted-note">Marked for deletion (applies after Save): ${del.map(id => `<button class="mini-btn" data-bundel="${esc(id)}">Undo &ldquo;${esc(String(state.content.blog[id].title || id).slice(0, 28))}&rdquo;</button>`).join(' ')}</p>`
      : '';
    return `
      <div class="blog-toolbar">
        <p class="content-hint" style="margin:0">Posts appear on the News &amp; Tips page, newest first. Categories outside the four built-in filters still show under &ldquo;All&rdquo;.</p>
        <button class="mini-btn primary" id="b-add">+ Add new post</button>
      </div>
      <div class="content-cards">${cards || '<p class="content-hint">No posts here — add one above, or press “Reset to defaults” to restore the original four.</p>'}</div>
      ${delNote}`;
  }

  function tabTestimonials() {
    const ids = Object.keys(state.content.testimonials).sort((a, b) => Number(a) - Number(b));
    return `<div class="content-cards">${ids.map(id => {
      const it = state.content.testimonials[id];
      return itemCard(`<span class="svc-i">★</span> ${esc(it.author)}`, `
        ${cBiFlat('Quote', 'testimonials.' + id, 'quote', 'quoteAm', { area: true, rows: 3 })}
        ${cBiFlat('Author name', 'testimonials.' + id, 'author', 'authorAm')}
        ${cBiFlat('Role / Title', 'testimonials.' + id, 'role', 'roleAm')}
      `);
    }).join('')}</div>`;
  }

  function tabFaq() {
    const ids = Object.keys(state.content.faqs).sort((a, b) => Number(a) - Number(b));
    return `<div class="content-cards">${ids.map(id => {
      const f = state.content.faqs[id];
      return itemCard(`<span class="svc-i">Q${esc(id)}</span> ${esc(f.q)}`, `
        ${cBiFlat('Question', 'faqs.' + id, 'q', 'qAm')}
        ${cBiFlat('Answer', 'faqs.' + id, 'a', 'aAm', { area: true, rows: 3 })}
      `);
    }).join('')}</div>`;
  }

  function tabIdentity() {
    const goals = [0, 1, 2, 3, 4].map(i => itemCard(`Goal ${i + 1}: ${esc(getPath(state.content, 't.en.identity.goals.items.' + i + '.title') || '')}`, `
      ${cBi('Title', 't.{L}.identity.goals.items.' + i + '.title')}
      ${cBi('Description', 't.{L}.identity.goals.items.' + i + '.desc', { area: true, rows: 2 })}
    `)).join('');
    const objectives = [0, 1, 2, 3, 4, 5, 6, 7].map(i =>
      cBi('Objective ' + (i + 1), 't.{L}.identity.objectives.items.' + i, { area: true, rows: 2 })).join('');
    return `
      <div class="content-grid">
        ${cBi('Badge title', 't.{L}.identity.title')}
        ${cBi('Main heading', 't.{L}.identity.subtitle', { area: true, rows: 2 })}
        ${cBi('Vision title', 't.{L}.identity.vision.title')}
        ${cBi('Vision text', 't.{L}.identity.vision.content', { area: true, rows: 4 })}
        ${cBi('Mission title', 't.{L}.identity.mission.title')}
        ${cBi('Mission text', 't.{L}.identity.mission.content', { area: true, rows: 4 })}
      </div>
      <h4 class="cgroup-title">Core Goals</h4>
      <div class="content-cards">${goals}</div>
      <h4 class="cgroup-title">Strategic Objectives</h4>
      <div class="content-grid">${objectives}</div>`;
  }

  function tabWhy() {
    const reasons = [0, 1, 2, 3, 4].map(i => cBi('Reason ' + (i + 1), 't.{L}.why_us.reasons.' + i)).join('');
    return `
      <div class="content-grid">
        ${cBi('Title', 't.{L}.why_us.title')}
        ${cBi('Description', 't.{L}.why_us.description', { area: true, rows: 3 })}
      </div>
      <h4 class="cgroup-title">Checklist items</h4>
      <div class="content-grid">${reasons}</div>`;
  }

  function tabContact() {
    const phones = [0, 1, 2].map(i => cField('Phone ' + (i + 1), 'contact.phones.' + i, { rows: 0 })).join('');
    return `
      <h4 class="cgroup-title">Phone numbers</h4>
      <p class="content-hint">Tap-to-call links in the Contact section. Keep the format with country code, e.g. <code>+251 9XX XXX XXX</code>.</p>
      <div class="content-grid">${phones}</div>
      <h4 class="cgroup-title">Direct channels</h4>
      <div class="content-grid">
        ${cField('WhatsApp number (digits only, e.g. 251915843131)', 'contact.whatsapp')}
        ${cField('Email address', 'contact.email')}
        ${cField('Location line (EN)', 'contact.location.en', { lang: 'en' })}
        ${cField('Location line (AM)', 'contact.location.am', { lang: 'am' })}
      </div>
      <p class="content-hint">The WhatsApp number powers the footer icon, the floating chat, and the contact-form fallback — changes apply after saving &amp; reloading the site.</p>`;
  }

  const C_TAB_RENDER = {
    hero: tabHero, sections: tabSections, services: tabServices, events: tabEvents, blog: tabBlog,
    testimonials: tabTestimonials, faq: tabFaq, identity: tabIdentity, why: tabWhy, contact: tabContact,
    seo: tabSeo,
  };

  /* ── SEO tab (per-page meta titles / descriptions) ── */
  const SEO_PAGES = [
    ['home', 'Home page', 'akirmaevents.com'],
    ['services', 'Services page', 'akirmaevents.com/services.html'],
    ['gallery', 'Gallery page', 'akirmaevents.com/gallery.html'],
    ['about', 'About page', 'akirmaevents.com/about.html'],
    ['blog', 'News & Tips page', 'akirmaevents.com/blog.html'],
  ];

  /* ── SEO toolbox: sitemap & robots generator (client-side helper state,
     intentionally NOT part of the publishable content overrides) ── */
  const TOOLS_KEY = 'akirma_seo_tools';
  const SITEMAP_PAGES = [
    ['home', 'Home', '', '1.0', 'monthly'],
    ['about', 'About', 'about.html', '0.8', 'monthly'],
    ['services', 'Services', 'services.html', '0.8', 'monthly'],
    ['gallery', 'Gallery', 'gallery.html', '0.7', 'monthly'],
    ['blog', 'News & Tips', 'blog.html', '0.7', 'weekly'],
  ];
  const ROBOTS_DEFAULT = 'User-agent: *\nAllow: /\nDisallow: /admin.html\n\nSitemap: https://akirmaevents.com/sitemap.xml';

  function seoTools() {
    if (state.seoTools) return state.seoTools;
    try {
      const raw = localStorage.getItem(TOOLS_KEY);
      const o = raw ? JSON.parse(raw) : null;
      if (o && typeof o === 'object' && o.pages) { state.seoTools = o; return o; }
    } catch (e) {}
    const today = new Date().toISOString().slice(0, 10);
    const pages = {};
    SITEMAP_PAGES.forEach(([id]) => { pages[id] = { on: true, lastmod: today }; });
    state.seoTools = { siteUrl: 'https://akirmaevents.com', pages, robots: ROBOTS_DEFAULT, robotsSite: ROBOTS_DEFAULT, seeded: false };
    return state.seoTools;
  }
  function saveSeoTools() {
    try { localStorage.setItem(TOOLS_KEY, JSON.stringify(state.seoTools)); } catch (e) {}
  }

  /** Prefill lastmod dates + robots.txt from the live files (first run only). */
  function seedSeoToolsFromSite() {
    const st = seoTools();
    if (st.seeded || typeof fetch !== 'function') return;
    st.seeded = true; // set first — prevents fetch-failure render loops
    Promise.all([
      fetch('sitemap.xml').then(r => (r.ok ? r.text() : '')),
      fetch('robots.txt').then(r => (r.ok ? r.text() : '')),
    ]).then(([sx, rb]) => {
      try {
        if (sx) {
          const doc = new DOMParser().parseFromString(sx, 'application/xml');
          const base = (st.siteUrl || '').replace(/\/$/, '');
          doc.querySelectorAll('url').forEach(u => {
            const loc = ((u.querySelector('loc') || {}).textContent || '').trim();
            const lm = ((u.querySelector('lastmod') || {}).textContent || '').trim();
            const hit = SITEMAP_PAGES.find(([id, , file]) => loc === base + '/' + file || (id === 'home' && loc === base + '/'));
            if (hit && /^\d{4}-\d{2}-\d{2}$/.test(lm)) st.pages[hit[0]].lastmod = lm;
          });
        }
      } catch (e) {}
      if (rb && rb.trim()) { st.robots = rb.trim(); st.robotsSite = rb.trim(); }
      saveSeoTools();
      if (state.view === 'content' && state.contentTab === 'seo') render();
    }).catch(() => {});
  }

  function buildSitemapXml(st) {
    const base = (st.siteUrl || 'https://akirmaevents.com').replace(/\/$/, '');
    const today = new Date().toISOString().slice(0, 10);
    const rows = SITEMAP_PAGES.filter(([id]) => st.pages[id] && st.pages[id].on !== false).map(([id, , file, pri, freq]) => {
      const lm = /^\d{4}-\d{2}-\d{2}$/.test(st.pages[id].lastmod || '') ? st.pages[id].lastmod : today;
      return `  <url>\n    <loc>${base}/${file}</loc>\n    <lastmod>${lm}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>`;
  }

  function seoVerificationCard() {
    return `
      <h4 class="cgroup-title">Site verification — Google Search Console &amp; Bing</h4>
      <p class="content-hint">Paste the verification code, or the whole &lt;meta&gt; tag they give you — the code is extracted automatically. Then Save &amp; Preview and publish the snippet (Googlebot renders JavaScript, so the meta method is normally accepted). The bulletproof alternative is the HTML-file method: download the googlexxxx.html file they offer and upload it into the repo root on github.com.</p>
      <div class="content-grid">
        ${cField('Google Search Console verification', 'seo.verification.google')}
        ${cField('Bing Webmaster verification', 'seo.verification.bing')}
      </div>`;
  }

  function seoToolbox() {
    const st = seoTools();
    const rows = SITEMAP_PAGES.map(([id, label]) => {
      const p = st.pages[id] || { on: true, lastmod: '' };
      return `<label class="st-row"><input type="checkbox" data-st="page" data-st-page="${id}" ${p.on !== false ? 'checked' : ''} /><span class="st-name">${esc(label)}</span><input type="date" class="form-input cin" data-st="date" data-st-page="${id}" value="${esc(p.lastmod || '')}" aria-label="${esc(label)} last modified" /></label>`;
    }).join('');
    return `
      <h4 class="cgroup-title">Sitemap &amp; robots.txt generator</h4>
      <p class="content-hint">Crawlers fetch <code>sitemap.xml</code> and <code>robots.txt</code> as static files — JavaScript can't rewrite them at runtime, so this generator builds the content for you: tweak the pages/dates below, click a copy button, paste it over the file in the repo (github.com → open file → pencil icon) and commit.</p>
      <div class="seo-toolbox">
        <label class="cfield"><span class="clabel">Site URL (used in the generated files)</span><input class="form-input cin" data-st="siteUrl" value="${esc(st.siteUrl)}" /></label>
        <span class="clabel">Pages — include &amp; last-modified date</span>
        <div class="st-pages">${rows}</div>
        <span class="clabel">Generated sitemap.xml</span>
        <pre class="st-pre" id="st-sitemap">${esc(buildSitemapXml(st))}</pre>
        <div class="publish-actions"><button class="mini-btn primary" id="st-copy-sitemap">Copy sitemap.xml</button></div>
        <label class="cfield"><span class="clabel">robots.txt</span><textarea class="form-input cin" id="st-robots" rows="4">${esc(st.robots)}</textarea></label>
        <div class="publish-actions">
          <button class="mini-btn primary" id="st-copy-robots">Copy robots.txt</button>
          <button class="mini-btn" id="st-robots-restore">Restore current file</button>
        </div>
      </div>`;
  }

  function seoEdited(page) {
    const d = ((C.defaults() || {}).seo || {})[page] || {};
    const e = (state.content.seo || {})[page] || {};
    return String(e.title || '') !== String(d.title || '') ||
           String(e.description || '') !== String(d.description || '');
  }

  function seoCard(page, label, url) {
    const seo = (state.content.seo || {})[page] || {};
    const title = seo.title || '';
    const desc = seo.description || '';
    const edited = seoEdited(page);
    return itemCard(
      `<span class="svc-i">G</span> ${esc(label)} <span class="seo-sum-url">${esc(url)}</span>${edited ? ' <em class="lang-chip en">edited</em>' : ''}`,
      `
      <div class="seo-field">
        <span class="clabel">Meta title — browser tab &amp; Google headline <em class="seo-count" data-seo-count="${page}" data-seo-for="title"></em></span>
        <input class="form-input cin" data-bind="seo.${page}.title" data-seo-input="${page}" maxlength="120" value="${esc(title)}" />
      </div>
      <div class="seo-field">
        <span class="clabel">Meta description — Google snippet &amp; WhatsApp/Facebook previews <em class="seo-count" data-seo-count="${page}" data-seo-for="description"></em></span>
        <textarea class="form-input cin" rows="3" maxlength="320" data-bind="seo.${page}.description" data-seo-input="${page}">${esc(desc)}</textarea>
      </div>
      <div class="clabel">Search preview (Google)</div>
      <div class="serp" data-serp="${page}">
        <div class="serp-url"><span class="serp-fav"></span><span class="serp-site">Akirma Events PLC</span> › ${esc(url)}</div>
        <div class="serp-title" data-seo-prev="${page}" data-seo-for="title">${esc(title)}</div>
        <div class="serp-desc" data-seo-prev="${page}" data-seo-for="description">${esc(desc)}</div>
      </div>
      `,
      false,
      `data-seo-card="${page}"`
    );
  }

  function tabSeo() {
    seedSeoToolsFromSite();
    return `
      ${seoVerificationCard()}
      <h4 class="cgroup-title" style="margin-top:2rem">Page meta — titles &amp; descriptions</h4>
      <p class="content-hint">The browser-tab title and the description shown under each page in Google results and WhatsApp/Facebook link previews. Aim for <strong>≤60</strong> characters in titles and <strong>≤160</strong> in descriptions — the preview below trims anything longer, just like Google. Fields are English (search engines index one version per page). Save &amp; Preview applies them in this browser instantly; publish the snippet for everyone, then give Google a few days to re-crawl.</p>
      <div class="content-cards">${SEO_PAGES.map(p => seoCard(p[0], p[1], p[2])).join('')}</div>
      ${seoToolbox()}`;
  }

  /** Live char counters + Google-style preview for one SEO page card. */
  function updateSeoPreview(page) {
    const seo = (state.content.seo || {})[page] || {};
    const t = String(seo.title || '');
    const d = String(seo.description || '');
    document.querySelectorAll(`[data-seo-count="${page}"]`).forEach(el => {
      const isT = el.dataset.seoFor === 'title';
      const n = isT ? t.length : d.length;
      const max = isT ? 60 : 160;
      el.textContent = n + '/' + max;
      el.classList.toggle('over', n > max);
      el.classList.toggle('near', n > max - 15 && n <= max);
    });
    document.querySelectorAll(`[data-seo-prev="${page}"]`).forEach(el => {
      const isT = el.dataset.seoFor === 'title';
      const raw = isT ? t : d;
      const max = isT ? 60 : 160;
      el.textContent = raw.length > max ? raw.slice(0, max - 1) + '…' : (raw || '—');
    });
  }


  /* ── CONTENT VIEW (render + actions) ── */
  function renderContent(c) {
    if (!C) {
      c.innerHTML = '<div class="panel"><div class="empty-state"><p>js/content.js failed to load — content editing is unavailable.</p></div></div>';
      return;
    }
    ensureContentState();

    const snippet = 'window.AKIRMA_SITE_OVERRIDES = ' + JSON.stringify(C.diffFromDefaults(state.content), null, 2) + ';';

    c.innerHTML = `
      <div class="panel content-intro">
        <div class="content-steps">
          <div class="cstep"><span class="step-num">1</span><div><h4>Edit</h4><p>Change any landing-page content below — headlines, stats, services, events &amp; photos, blog posts, testimonials, FAQ, contact info — plus each page's SEO title &amp; description (SEO tab).</p></div></div>
          <div class="cstep"><span class="step-num">2</span><div><h4>Save &amp; Preview</h4><p>Saves to this browser. Open the website and your changes appear instantly (bilingual — check both EN and AM fields).</p></div></div>
          <div class="cstep"><span class="step-num">3</span><div><h4>Publish</h4><p>Copy the snippet into <code>js/site-overrides.js</code> (editable on github.com) and commit — the change goes live for every visitor.</p></div></div>
        </div>
        <details class="publish-box">
          <summary>Publish for every visitor / Export &amp; Import</summary>
          <p>After saving, click <strong>Copy publish snippet</strong> and paste it over the empty object in <code>js/site-overrides.js</code>, then commit &amp; push (you can edit that file directly on github.com). Until published, changes are visible in <em>this browser only</em>.</p>
          <p class="content-hint">Photo tip: uploaded photos are embedded as compressed data URLs for instant preview. For the published site, upload the image file into <code>images/events/</code> (github.com supports drag &amp; drop upload) and paste its path into the photo field instead — the snippet stays small and loads faster.</p>
          <pre id="publish-pre">${esc(snippet)}</pre>
          <div class="publish-actions">
            <button class="mini-btn primary" id="c-copy">${ICONS.download} Copy publish snippet</button>
            <button class="mini-btn" id="c-export">${ICONS.download} Export JSON</button>
            <button class="mini-btn" id="c-import-toggle">Import JSON</button>
          </div>
          <div id="c-import-wrap" style="display:none">
            <textarea class="form-input cin" id="c-import-json" rows="6" placeholder='Paste an exported overrides JSON object here, then click Apply…'></textarea>
            <div class="publish-actions"><button class="mini-btn primary" id="c-import-apply">Apply to form</button></div>
          </div>
        </details>
      </div>

      <div class="subtabs" id="c-subtabs">
        ${C_TABS.map(([id, label]) => {
          const lbl = id === 'blog' ? label + ' (' + blogLiveCount() + ')' : label;
          return `<button class="subtab ${state.contentTab === id ? 'active' : ''}" data-tab="${id}">${esc(lbl)}</button>`;
        }).join('')}
      </div>

      <div class="panel content-panel">
        ${(C_TAB_RENDER[state.contentTab] || tabHero)()}
      </div>

      <div class="save-bar" id="c-savebar">
        <span class="save-status" id="c-status">Ready</span>
        <div class="save-actions">
          <button class="mini-btn primary" id="c-save">Save &amp; Preview</button>
          <button class="mini-btn" id="c-discard">Discard changes</button>
          <button class="mini-btn danger" id="c-reset">Reset to defaults</button>
        </div>
      </div>`;

    // sub-tab switching
    c.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      state.contentTab = b.dataset.tab;
      render();
    }));

    // two-way binding
    c.querySelectorAll('[data-bind]').forEach(el => {
      el.addEventListener('input', () => {
        const p = el.dataset.bind;
        if (el.hasAttribute('data-features')) {
          setPath(state.content, p, el.value.split('\n').map(s => s.trim()).filter(Boolean));
        } else if (p.lastIndexOf('seo.verification.', 0) === 0) {
          // accept a pasted full <meta …> tag — keep only the extracted code
          const m = el.value.match(/content\s*=\s*["']([^"']+)["']/i);
          const v = m ? m[1].trim() : el.value.trim();
          setPath(state.content, p, v);
          if (m) el.value = v;
        } else {
          setPath(state.content, p, el.value);
        }
        updateCountFor(p);
        updateContentStatus();
      });
    });

    // SEO: live counters + Google preview (state is updated by the binding above)
    c.querySelectorAll('[data-seo-input]').forEach(el => {
      el.addEventListener('input', () => updateSeoPreview(el.dataset.seoInput));
    });
    SEO_PAGES.forEach(p => updateSeoPreview(p[0]));
    c.querySelectorAll('[data-count-for]').forEach(el => updateCountFor(el.dataset.countFor));

    // SEO toolbox: sitemap & robots generator (client-side helper state)
    const stChange = el => {
      const st = seoTools();
      if (el.dataset.st === 'siteUrl') st.siteUrl = el.value;
      else if (el.dataset.st === 'date') (st.pages[el.dataset.stPage] = st.pages[el.dataset.stPage] || {}).lastmod = el.value;
      else if (el.dataset.st === 'page') (st.pages[el.dataset.stPage] = st.pages[el.dataset.stPage] || {}).on = el.checked;
      saveSeoTools();
      const pre = $('st-sitemap');
      if (pre) pre.textContent = buildSitemapXml(st);
    };
    c.querySelectorAll('[data-st]').forEach(el => {
      el.addEventListener('input', () => stChange(el));
      el.addEventListener('change', () => stChange(el));
    });
    const stRobots = $('st-robots');
    if (stRobots) stRobots.addEventListener('input', () => { seoTools().robots = stRobots.value; saveSeoTools(); });
    const cpMap = $('st-copy-sitemap');
    if (cpMap) cpMap.addEventListener('click', () => {
      const text = buildSitemapXml(seoTools());
      const done = () => { status.textContent = '✓ sitemap.xml copied — paste it over sitemap.xml in the repo and commit.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      else fallbackCopy(text, done);
    });
    const cpRob = $('st-copy-robots');
    if (cpRob) cpRob.addEventListener('click', () => {
      const text = stRobots ? stRobots.value : seoTools().robots;
      const done = () => { status.textContent = '✓ robots.txt copied — paste it over robots.txt in the repo and commit.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      else fallbackCopy(text, done);
    });
    const rstRob = $('st-robots-restore');
    if (rstRob) rstRob.addEventListener('click', () => {
      const st = seoTools();
      st.robots = st.robotsSite || ROBOTS_DEFAULT;
      saveSeoTools();
      if (stRobots) stRobots.value = st.robots;
      status.textContent = 'Restored the robots.txt content currently in the repo.';
    });

    // photo uploads → downscaled embedded data URL (instant preview)
    c.querySelectorAll('[data-imgbind]').forEach(inp => {
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const path = inp.dataset.imgbind;
        const wrap = inp.closest('.cimg-edit');
        downscaleImage(f, 1600, 0.82).then(dataUrl => {
          setPath(state.content, path, dataUrl);
          const inp2 = wrap.querySelector('input[data-bind]');
          if (inp2) inp2.value = dataUrl;
          const img = wrap.querySelector('.cimg-thumb img');
          if (img) { img.src = dataUrl; img.style.display = ''; }
          const note = wrap.querySelector('.cimg-note');
          if (note) note.textContent = 'Embedded photo (~' + Math.round(dataUrl.length / 1365) + ' KB) — preview only; publish with a repo path';
          updateContentStatus();
        }).catch(err => {
          const note = wrap.querySelector('.cimg-note');
          if (note) note.textContent = '✕ ' + err.message;
        });
      });
    });

    // blog: add new post
    const bAdd = $('b-add');
    if (bAdd) bAdd.addEventListener('click', () => {
      const map = state.content.blog || (state.content.blog = {});
      let n = 1;
      while (map[String(n)]) n++;
      map[String(n)] = {
        slug: 'new-post-' + n, date: new Date().toISOString().slice(0, 10), read_min: 4,
        category: 'Tips', categoryAm: 'ምክር',
        image: 'images/events/photo_2026-01-29_22-06-34.jpg',
        title: 'New blog post', titleAm: 'አዲስ ጽሑፍ',
        excerpt: 'A short summary shown on the blog card.', excerptAm: 'በብሎግ ካርዱ ላይ የሚታይ አጭር ማጠቃለያ።',
        content: ['Write the first paragraph here. Each new line becomes its own paragraph on the site.'],
        contentAm: ['የመጀመሪያውን አንቀጽ እዚህ ይጻፉ። እያንዳንዱ አዲስ መስመር በጣቢያው ላይ የራሱ አንቀጽ ይሆናል።'],
      };
      state.contentTab = 'blog';
      render();
      const el = c.querySelector(`details[data-post="${n}"]`);
      if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });

    // blog: delete / undo delete
    c.querySelectorAll('[data-bdel]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.bdel;
      const p = state.content.blog[id];
      if (!confirm('Delete the post "' + ((p && p.title) || id) + '"? It disappears from the site after Save & Preview ("Reset to defaults" brings it back).')) return;
      setPath(state.content, 'blog.' + id + '._deleted', true);
      render();
    }));
    c.querySelectorAll('[data-bundel]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.bundel;
      const dflt = ((C.defaults() || {}).blog || {})[id];
      if (!dflt) delete state.content.blog[id];
      else delete state.content.blog[id]._deleted;
      render();
    }));

    const status = $('c-status');
    function updateContentStatus() {
      const dirty = contentDirty();
      status.textContent = dirty ? '● Unsaved changes' : (C.stored() ? 'Saved — visible in this browser (publish to make it live for everyone)' : 'No changes yet — showing published content');
      status.classList.toggle('dirty', dirty);
      c.querySelectorAll('.subtab').forEach(b => b.classList.toggle('active', b.dataset.tab === state.contentTab));
    }
    updateContentStatus();

    // Save & Preview
    $('c-save').addEventListener('click', () => {
      const r = C.save(state.content);
      if (!r.ok) { status.textContent = '✕ Could not save: ' + r.error; status.classList.add('dirty'); return; }
      state.contentSaved = JSON.stringify(r.overrides);
      const pre = $('publish-pre');
      if (pre) pre.textContent = 'window.AKIRMA_SITE_OVERRIDES = ' + JSON.stringify(r.overrides, null, 2) + ';';
      updateContentStatus();
      updateContentBadge();
      status.textContent = '✓ Saved — open the website in this browser to see your changes. Use "Copy publish snippet" above to make them live for everyone.';
    });

    // Discard
    $('c-discard').addEventListener('click', () => {
      state.content = C.effective();
      render();
    });

    // Reset
    $('c-reset').addEventListener('click', () => {
      if (!confirm('Reset ALL content edits for this browser back to the published defaults?')) return;
      C.clear();
      state.content = C.effective();
      state.contentSaved = '{}';
      render();
      updateContentBadge();
    });

    // Copy publish snippet
    $('c-copy').addEventListener('click', () => {
      const text = 'window.AKIRMA_SITE_OVERRIDES = ' + JSON.stringify(C.diffFromDefaults(state.content), null, 2) + ';';
      const done = () => { status.textContent = '✓ Snippet copied — paste it into js/site-overrides.js and commit to publish.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else fallbackCopy(text, done);
    });

    // Export JSON
    $('c-export').addEventListener('click', () => {
      const data = JSON.stringify(C.diffFromDefaults(state.content), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'akirma-content-overrides.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });

    // Import JSON
    $('c-import-toggle').addEventListener('click', () => {
      const w = $('c-import-wrap');
      w.style.display = w.style.display === 'none' ? 'block' : 'none';
    });
    $('c-import-apply').addEventListener('click', () => {
      const raw = $('c-import-json').value.trim();
      if (!raw) return;
      try {
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Not a JSON object');
        C.deepMergeInto(state.content, obj);
        render();
      } catch (err) {
        status.textContent = '✕ Import failed: ' + err.message;
        status.classList.add('dirty');
      }
    });
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ── GO ── */
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
