/**
 * AKIRMA EVENTS - shared.js
 * Shared logic for all pages (Header, Footer, Theme, Language).
 * Depends on data.js being loaded first.
 */

// ── STATE ───────────────────────────────────────────
let lang = localStorage.getItem('language') || 'en';
let isDark = document.documentElement.classList.contains('dark') ||
  (localStorage.getItem('theme') === 'dark') ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

// ── SVG ICONS ─────────────────────────────────────
const ICONS = {
  Heart: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>`,
  Briefcase: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>`,
  Star: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>`,
  Music: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>`,
  Palette: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>`,
  Megaphone: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" /></svg>`,
  Calendar: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>`,
  Home: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`,
  Lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>`,
  Armchair: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.006v1.902a2.25 2.25 0 0 1-1.883 2.22 17.93 17.93 0 0 1-6.617 0 2.25 2.25 0 0 1-1.883-2.22V10.5c0-.878.616-1.722 1.5-2.006M12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>`,
  UtensilsCrossed: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 4.5c0 1.036.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.839 1.875-1.875m-12 0v6.75c0 1.035.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.84 1.875-1.875v-6.75M5.25 12h13.5" /></svg>`,
  Baby: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`,
  Globe: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>`,
  Sun: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.25rem;height:1.25rem" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>',
  Moon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.25rem;height:1.25rem" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>',
  Menu: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.5rem;height:1.5rem" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>',
  X: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.5rem;height:1.5rem" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>',
  ChevronDown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`,
  ChevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>`,
  ChevronRight: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>`,
  MagnifyingGlass: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" /></svg>`,
  MessageSquare: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>`,
  CheckCircleSolid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1.25rem;height:1.25rem"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg>`,
};

// ── UTILS ──────────────────────────────────────────
function t() { return T[lang]; }

// ── THEME ──────────────────────────────────────────
function applyTheme() {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  // CSS handles .icon-sun/.icon-moon visibility via body.dark rules — no inline style needed
}

function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
}

// ── LANGUAGE ──────────────────────────────────────────
function applyLang() {
  document.documentElement.lang = lang;
  if (lang === 'am') {
    document.body.classList.add('font-ethiopic');
  } else {
    document.body.classList.remove('font-ethiopic');
  }
}

function toggleLang() {
  lang = lang === 'en' ? 'am' : 'en';
  localStorage.setItem('language', lang);
  applyLang();
  // Most pages need a re-render after language change
  if (typeof renderAll === 'function') renderAll();
  else if (typeof renderPage === 'function') renderPage();
  else location.reload(); // Fallback
}

// ── SHARED RENDERERS ────────────────────────────────
function initSharedComponents() {
  renderSharedHeader();
  renderSharedFooter();
  renderSharedFloatingChat();
  bindSharedEvents();
}

function renderSharedHeader() {
  const tr = t();
  const header = document.querySelector('header');
  if (!header) return;

  const isIndex = location.pathname.includes('index.html') || location.pathname === '/' || location.pathname.endsWith('/');
  const prefix = isIndex ? '' : 'index.html';

  header.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <div class="container">
      <div class="header-inner">
        <!-- Logo -->
        <a href="${prefix}#" class="logo-link" aria-label="Akirma Events Home">
          <div class="logo-img-wrap"><img src="logo.png" alt="Akirma Events Logo" /></div>
          <span class="logo-name">Akirma</span>
        </a>

        <!-- Desktop Nav -->
        <nav class="desktop-nav">
          <a id="nav-home" href="${prefix}#">${tr.nav.home}</a>
          <a href="services.html" id="nav-services-page" class="${location.pathname.includes('services.html')?'active':''}">${tr.nav.services}</a>
          <a id="nav-events" href="${prefix}#featured-events">${tr.nav.events}</a>
          <a id="nav-testimonials" href="${prefix}#testimonials">${tr.nav.testimonials}</a>
          <a href="gallery.html" id="nav-gallery" class="${location.pathname.includes('gallery.html')?'active':''}">${tr.nav.gallery}</a>
          <a id="nav-contact" href="${prefix}#contact">${tr.nav.contact}</a>
        </nav>

        <!-- Desktop Right -->
        <div class="nav-right">
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            <span class="icon-sun">${ICONS.Sun}</span>
            <span class="icon-moon">${ICONS.Moon}</span>
          </button>
          <button class="lang-btn" id="lang-toggle" aria-label="Switch Language (Current: ${lang.toUpperCase()})">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1rem;height:1rem" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            <span id="lang-label">${lang === 'en' ? 'AM' : 'EN'}</span>
          </button>
          <a href="${prefix}#contact" class="btn btn-primary btn-sm" id="nav-book">${tr.nav.book}</a>
        </div>

        <!-- Mobile Controls -->
        <div class="mobile-controls">
          <button class="theme-toggle" id="theme-toggle-mob" aria-label="Toggle theme">
            <span class="icon-sun">${ICONS.Sun}</span>
            <span class="icon-moon">${ICONS.Moon}</span>
          </button>
          <button class="hamburger" id="hamburger" aria-label="Toggle menu">
            <span id="hamburger-icon">${ICONS.Menu}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobile-menu">
      <div class="container" style="display:flex;flex-direction:column;gap:1rem;">
        <a id="mob-nav-home" href="${prefix}#">${tr.nav.home}</a>
        <a href="services.html" class="${location.pathname.includes('services.html')?'active':''}">${tr.nav.services}</a>
        <a id="mob-nav-events" href="${prefix}#featured-events">${tr.nav.events}</a>
        <a id="mob-nav-testimonials" href="${prefix}#testimonials">${tr.nav.testimonials}</a>
        <a href="gallery.html" class="${location.pathname.includes('gallery.html')?'active':''}">${tr.nav.gallery}</a>
        <a id="mob-nav-contact" href="${prefix}#contact">${tr.nav.contact}</a>
        <div class="book-btn-wrap">
          <a href="${prefix}#contact" class="btn btn-primary btn-md" id="mob-nav-book">${tr.nav.book}</a>
        </div>
      </div>
    </div>
  `;
}

function renderSharedFooter() {
  const tr = t();
  const footer = document.querySelector('footer');
  if (!footer) return;

  const isIndex = location.pathname.includes('index.html') || location.pathname === '/' || location.pathname.endsWith('/');
  const prefix = isIndex ? '' : 'index.html';

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <!-- Brand -->
        <div>
          <a href="${prefix}#" class="footer-logo" aria-label="Akirma Events Home">
            <img src="logo.png" alt="Akirma Events Logo" class="footer-logo-img" />
            <span class="footer-logo-name">Akirma</span>
          </a>
          <p class="footer-desc">${tr.footer.description}</p>
        </div>

        <!-- Quick Links -->
        <div class="footer-col">
          <h3>${tr.footer.quick_links}</h3>
          <ul class="footer-links">
            <li><a href="${prefix}#">${tr.nav.home}</a></li>
            <li><a href="services.html">${tr.nav.services}</a></li>
            <li><a href="gallery.html">${tr.nav.gallery}</a></li>
            <li><a href="${prefix}#featured-events">${tr.nav.events}</a></li>
            <li><a href="${prefix}#testimonials">${tr.nav.testimonials}</a></li>
            <li><a href="${prefix}#contact">${tr.nav.contact}</a></li>
          </ul>
        </div>

        <!-- Services -->
        <div class="footer-col">
          <h3>${tr.footer.services_title}</h3>
          <ul class="footer-links">
            ${SERVICES.slice(0, 5).map(s => `<li><a href="${isIndex ? '#services' : 'services.html'}">${lang === 'am' ? s.nameAm : s.name}</a></li>`).join('')}
          </ul>
        </div>

        <!-- Connect -->
        <div class="footer-col">
          <h3>${tr.footer.connect}</h3>
          <div class="social-links">
            <a href="https://wa.me/251915843131" target="_blank" rel="noopener" class="social-btn social-btn-wa" title="WhatsApp">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>
            </a>
            <a href="https://www.facebook.com/share/1CFo9pz9T1/?mibextid=wwXIfr" target="_blank" rel="noopener" class="social-btn social-btn-fb" title="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/akirmaevents?igsh=dXBmdmRnZHpjbDBm&utm_source=qr" target="_blank" rel="noopener" class="social-btn social-btn-ig" title="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://t.me/akirmaeventsplc" target="_blank" rel="noopener" class="social-btn social-btn-tg" title="Telegram">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </a>
          </div>
          <p class="newsletter-label">${tr.footer.newsletter}</p>
          <div class="newsletter-form">
            <input type="email" class="newsletter-input" id="footer-nl-input" placeholder="${tr.footer.email_placeholder}" aria-label="Email address for newsletter" />
            <button class="newsletter-btn-sub" id="footer-nl-btn" aria-label="Subscribe to newsletter">${tr.footer.go}</button>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="footer-bottom">
        <p>© 2025 Akirma Events PLC. All rights reserved.</p>
        <div class="footer-legal">
          <a href="akirma-price-list.pdf" target="_blank">${tr.footer.pricelist}</a>
          <a href="#">${tr.footer.privacy}</a>
          <a href="#">${tr.footer.terms}</a>
        </div>
      </div>
    </div>
  `;
}

function renderSharedFloatingChat() {
  if (document.querySelector('.floating-chat')) return; // Already exists?

  const tr = t();
  const div = document.createElement('div');
  div.className = 'floating-chat';
  div.innerHTML = `
    <div class="chat-popup" id="chat-popup">
      <div class="chat-popup-header">
        <div class="chat-avatar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.25rem;height:1.25rem;color:white"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
        </div>
        <div class="chat-info">
          <h4>Akirma Events</h4>
          <div class="chat-online">
            <span class="online-dot"></span>
            <span>${tr.chat.we_are_online}</span>
          </div>
        </div>
      </div>
      <div class="chat-popup-body">
        <p class="chat-greeting">${tr.chat.greeting}</p>
        <a href="https://t.me/akirmaeventsplc" target="_blank" rel="noopener" class="chat-link chat-link-tg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1.25rem;height:1.25rem"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
          <span>${tr.chat.telegram}</span>
        </a>
        <a href="https://wa.me/251915843131" target="_blank" rel="noopener" class="chat-link chat-link-wa">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1.25rem;height:1.25rem"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>
          <span>${tr.chat.whatsapp}</span>
        </a>
      </div>
    </div>
    <button class="chat-toggle-btn" id="chat-toggle" aria-label="Chat with us">
      <span id="chat-icon">${ICONS.MessageSquare}</span>
      <span class="chat-notif" id="chat-notif"></span>
    </button>
  `;
  document.body.appendChild(div);
}

function bindSharedEvents() {
  // Theme
  document.querySelectorAll('#theme-toggle, #theme-toggle-mob').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Language
  document.querySelectorAll('#lang-toggle, #lang-toggle-mob').forEach(btn => {
    btn.addEventListener('click', toggleLang);
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      const icon = document.getElementById('hamburger-icon');
      const isOpen = menu.classList.toggle('open');
      icon.innerHTML = isOpen ? ICONS.X : ICONS.Menu;
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.remove('open');
      document.getElementById('hamburger-icon').innerHTML = ICONS.Menu;
    });
  });

  // Chat
  const chatToggle = document.getElementById('chat-toggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      const popup = document.getElementById('chat-popup');
      const icon = document.getElementById('chat-icon');
      const isOpen = popup.classList.toggle('open');
      icon.innerHTML = isOpen ? ICONS.X : ICONS.MessageSquare;
      document.getElementById('chat-notif').style.display = isOpen ? 'none' : '';
    });
  }

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) header.style.boxShadow = window.scrollY > 20 ? '0 1px 3px rgba(0,0,0,0.1)' : '';
  }, { passive: true });
}

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyLang();
  initSharedComponents();
});
