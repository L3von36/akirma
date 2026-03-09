// =====================================================
// AKIRMA EVENTS - app.js
// Exact replica of all Next.js component logic
// =====================================================

// Data and Icons are now loaded from js/data.js

// ── STATE ───────────────────────────────────────────
let modalOpen = false;
let modalIndex = 0;
let estimatorGuests = 100;
let estimatorLevel = 1;

const galleryImages = ALL_EVENTS.map(e => e.image);

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  bindEvents();
  initActiveNav();
  initSkipLink();
});

// ── RENDER ALL ─────────────────────────────────────
function renderAll() {
  renderHero();
  renderServices();
  renderVisionMission();
  renderFeaturedEvents();
  renderWhyChooseUs();
  renderTestimonials();
  renderFAQ();
  renderBudgetEstimator();
  renderContact();
  renderGallery();
}

// ── HERO ──────────────────────────────────────────
function renderHero() {
  const tr = t();
  document.getElementById('hero-title').textContent = tr.hero.headline_main;
  document.getElementById('hero-sub').textContent = tr.hero.subheadline;
  document.getElementById('hero-cta1').textContent = tr.hero.cta_primary;
  document.getElementById('hero-cta2').textContent = tr.hero.cta_secondary;
}

// ── SERVICES ──────────────────────────────────────────
function renderServices() {
  const tr = t();
  document.getElementById('services-title').textContent = tr.services.title;
  document.getElementById('services-desc').textContent = tr.services.description;
  document.getElementById('services-see-more').textContent = lang === 'am' ? 'ሁሉንም አገልግሎቶች ይመልከቱ' : 'See All Services';

  const grid = document.getElementById('services-grid');
  grid.innerHTML = SERVICES.slice(0,6).map(s => `
    <div class="service-card">
      <div class="service-icon-wrap">${ICONS[s.iconName] || ICONS.Star}</div>
      <h3>${lang === 'am' ? s.nameAm : s.name}</h3>
      <p>${lang === 'am' ? s.descAm : s.desc}</p>
    </div>
  `).join('');
}

// ── VISION / MISSION ──────────────────────────────────────────
function renderVisionMission() {
  const tr = t();
  const id = tr.identity;

  document.getElementById('vm-badge-text').textContent = id.title;
  document.getElementById('vm-main-title').textContent = id.subtitle;
  document.getElementById('vm-vision-title').textContent = id.vision.title;
  document.getElementById('vm-vision-content').textContent = `"${id.vision.content}"`;
  document.getElementById('vm-mission-title').textContent = id.mission.title;
  document.getElementById('vm-mission-content').textContent = `"${id.mission.content}"`;
  document.getElementById('vm-goals-title').textContent = id.goals.title;

  const goalIcons = [ICONS.ShieldCheck, ICONS.Zap, ICONS.Award, ICONS.BarChart, ICONS.Rocket];
  document.getElementById('goals-grid').innerHTML = id.goals.items.map((g, i) => `
    <div class="goal-card">
      ${goalIcons[i % goalIcons.length]}
      <h4>${g.title}</h4>
      <p>${g.desc}</p>
    </div>
  `).join('');

  document.getElementById('obj-title').textContent = id.objectives.title;
  document.getElementById('objectives-grid').innerHTML = id.objectives.items.map(o => `
    <div class="obj-item">
      ${ICONS.CheckCircleSolid}
      <p>${o}</p>
    </div>
  `).join('');
}

// ── FEATURED EVENTS ──────────────────────────────────────────
function renderFeaturedEvents() {
  const tr = t();
  document.getElementById('events-title').textContent = tr.events.title;
  document.getElementById('events-desc').textContent = tr.events.description;

  document.getElementById('events-grid').innerHTML = FEATURED_EVENTS.map((e, i) => `
    <div class="event-card" onclick="openModal(${i})">
      <div class="event-card-img">
        <img src="${encodeURI(e.image).replace(/#/g, '%23')}" alt="${e.title}" loading="lazy" onerror="this.style.display='none'">
        <div class="event-card-overlay"></div>
        <div class="event-gallery-btn"><p>${tr.events.view_gallery}</p></div>
      </div>
      <div class="event-meta">
        <span class="event-cat">${lang === 'am' ? e.categoryAm : e.category}</span>
        <span class="event-year">${e.year}</span>
      </div>
      <h3 class="event-title">${lang === 'am' ? e.titleAm : e.title}</h3>
      <p class="event-loc">${lang === 'am' ? e.locationAm : e.location}</p>
    </div>
  `).join('');
}

// ── WHY CHOOSE US ──────────────────────────────────────────
function renderWhyChooseUs() {
  const tr = t();
  document.getElementById('why-title').textContent = tr.why_us.title;
  document.getElementById('why-list').innerHTML = tr.why_us.reasons.map(r => `
    <li class="why-list-item">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span>${r}</span>
    </li>
  `).join('');
}

// ── TESTIMONIALS ──────────────────────────────────────────
function renderTestimonials() {
  const tr = t();
  document.getElementById('testi-title').textContent = tr.testimonials.title;
  document.getElementById('testi-desc').textContent = tr.testimonials.description;
  document.getElementById('testi-grid').innerHTML = TESTIMONIALS.map(item => `
    <div class="testi-card">
      <div class="testi-quote-icon">${ICONS.Quote}</div>
      <div class="testi-content">
        <p class="testi-text">${lang === 'am' ? item.quoteAm : item.quote}</p>
        <div class="testi-author">
          <h4>${lang === 'am' ? item.authorAm : item.author}</h4>
          <span>${lang === 'am' ? item.roleAm : item.role}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── FAQ ──────────────────────────────────────────
function renderFAQ() {
  const tr = t();
  document.getElementById('faq-title').textContent = tr.faq.title;
  document.getElementById('faq-desc').textContent = tr.faq.description;
  document.getElementById('faq-list').innerHTML = FAQS.map((f, i) => `
    <div class="faq-item${i === faqOpenIndex ? ' open' : ''}" id="faq-item-${i}">
      <button class="faq-question" onclick="toggleFaq(${i})" aria-expanded="${i === faqOpenIndex}">
        <span>${lang === 'am' ? f.qAm : f.q}</span>
        <span class="faq-chevron">${ICONS.ChevronDown}</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${lang === 'am' ? f.aAm : f.a}</div>
      </div>
    </div>
  `).join('');
}

function toggleFaq(i) {
  faqOpenIndex = faqOpenIndex === i ? null : i;
  document.querySelectorAll('.faq-item').forEach((el, idx) => {
    el.classList.toggle('open', idx === faqOpenIndex);
    el.querySelector('.faq-question').setAttribute('aria-expanded', idx === faqOpenIndex);
  });
}

// ── BUDGET ESTIMATOR ──────────────────────────────────────────
function renderBudgetEstimator() {
  const tr = t();
  document.getElementById('est-title').textContent = tr.estimator.title;
  document.getElementById('est-desc').textContent = tr.estimator.description;
  document.getElementById('est-guests-label').textContent = tr.estimator.labels.guests;
  document.getElementById('est-level-label').textContent = tr.estimator.labels.service_level;
  document.getElementById('est-total-label').textContent = tr.estimator.labels.total;
  document.getElementById('est-range-label').textContent = tr.estimator.labels.range;
  document.getElementById('est-disclaimer').textContent = tr.estimator.labels.disclaimer;
  document.getElementById('est-book-btn').textContent = tr.nav.book;

  const levelData = [
    { icon: ICONS.Shield, desc:'Quality essentials covered' },
    { icon: ICONS.Sparkles, desc:'Enhanced decor & premium catering' },
    { icon: ICONS.Award, desc:'Luxurious details & VIP services' },
  ];
  document.getElementById('levels-grid').innerHTML = tr.estimator.levels.map((name, i) => `
    <button class="level-btn${i === estimatorLevel ? ' active' : ''}" onclick="setLevel(${i})">
      ${levelData[i].icon}
      <h4>${name}</h4>
      <p>${levelData[i].desc}</p>
    </button>
  `).join('');

  document.getElementById('est-slider').value = estimatorGuests;
  document.getElementById('est-guest-count').textContent = estimatorGuests;
  updateEstimate();
}

function setLevel(i) {
  estimatorLevel = i;
  document.querySelectorAll('.level-btn').forEach((el, idx) => el.classList.toggle('active', idx === i));
  updateEstimate();
}

function updateEstimate() {
  const baseRates = [800, 1500, 3000];
  const base = baseRates[estimatorLevel];
  const total = estimatorGuests * base;
  const min = Math.round(total * 0.9);
  const max = Math.round(total * 1.15);
  document.getElementById('est-total').textContent = total.toLocaleString();
  document.getElementById('est-range').textContent = `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

// ── CONTACT ──────────────────────────────────────────
function renderContact() {
  const tr = t();
  document.getElementById('contact-title').textContent = tr.contact.title;
  document.getElementById('contact-desc').textContent = tr.contact.description;
  document.getElementById('contact-phone-label').textContent = tr.contact.labels.phone;
  document.getElementById('contact-email-label').textContent = tr.contact.labels.email;
  document.getElementById('contact-loc-label').textContent = tr.contact.labels.location;
  document.getElementById('contact-name-label').textContent = tr.contact.labels.name;
  document.getElementById('contact-email2-label').textContent = tr.contact.labels.email;
  document.getElementById('contact-phone2-label').textContent = tr.contact.labels.phone;
  document.getElementById('contact-type-label').textContent = tr.contact.labels.eventType;
  document.getElementById('contact-msg-label').textContent = tr.contact.labels.message;
  document.getElementById('contact-submit').textContent = tr.contact.labels.submit;
  document.getElementById('contact-name-input').placeholder = tr.contact.form.name_placeholder;
  document.getElementById('contact-email-input').placeholder = tr.contact.form.email_placeholder;
  document.getElementById('contact-phone-input').placeholder = tr.contact.form.phone_placeholder;
  document.getElementById('contact-msg-input').placeholder = tr.contact.form.message_placeholder;
  document.getElementById('contact-type-select').innerHTML = tr.contact.form.types.map(type =>
    `<option value="${type}">${type}</option>`
  ).join('');
  document.getElementById('form-title').textContent = lang === 'am' ? 'መልእክት ላኩልን' : 'Send us a message';
}

async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('contact-submit');
  const successEl = document.getElementById('contact-success');
  const errorEl   = document.getElementById('contact-error');

  btn.innerHTML = `${ICONS.Loader} ${lang === 'am' ? 'እየተላከ...' : 'Sending...'}`;
  btn.disabled = true;
  if (errorEl) errorEl.style.display = 'none';

  const params = {
    from_name:  document.getElementById('contact-name-input').value,
    from_email: document.getElementById('contact-email-input').value,
    phone:      document.getElementById('contact-phone-input').value,
    event_type: document.getElementById('contact-type-select').value,
    event_date: document.getElementById('contact-date-input').value,
    message:    document.getElementById('contact-msg-input').value,
    to_name:    'Akirma Events Team',
  };

  const svcId  = window.EMAILJS_SERVICE_ID;
  const tplId  = window.EMAILJS_TEMPLATE_ID;
  const pubKey = window.EMAILJS_PUBLIC_KEY;
  const emailjsReady = svcId && !svcId.startsWith('YOUR_') && typeof emailjs !== 'undefined';

  try {
    if (emailjsReady) {
      emailjs.init(pubKey);
      await emailjs.send(svcId, tplId, params);
    } else {
      // Demo mode — simulate delay
      await new Promise(r => setTimeout(r, 1200));
    }

    // Success
    successEl.classList.add('show');
    document.getElementById('contact-form').reset();
    btn.textContent = t().contact.labels.submit;
    btn.disabled = false;
    setTimeout(() => successEl.classList.remove('show'), 6000);

    if (!emailjsReady) {
    }
  } catch (err) {
    btn.textContent = t().contact.labels.submit;
    btn.disabled = false;
    if (errorEl) { errorEl.style.display = 'flex'; }
  }
}

// ── GALLERY (homepage preview — 6 images only) ───────
function renderGallery() {
  const tr = t();
  document.getElementById('gallery-title').textContent = lang === 'am' ? 'የዝግጅቶቻችን ጋለሪ' : 'Events Gallery';
  document.getElementById('gallery-desc').textContent = tr.events.description;
  const preview = galleryImages.slice(0, 6);
  document.getElementById('gallery-grid').innerHTML = preview.map((img, i) => {
    const ev = ALL_EVENTS.find(e => e.image === img);
    const title = ev ? (lang === 'am' ? ev.titleAm : ev.title) : `Gallery ${i+1}`;
    return `
      <div class="gallery-item" onclick="openModal(${i})">
        <img src="${encodeURI(img).replace(/#/g, '%23')}" alt="${title}" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="gallery-item-overlay">
          <div class="gallery-zoom-btn" role="button" aria-label="Zoom Image">${ICONS.MagnifyingGlass}</div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('gallery-see-all').textContent = lang === 'am'
    ? `ሁሉንም ፎቶዎች ይመልከቱ (${galleryImages.length})`
    : `View All Photos (${galleryImages.length})`;
}

// ── LIGHTBOX ──────────────────────────────────────────
function openModal(i) {
  modalIndex = i;
  modalOpen = true;
  document.getElementById('photo-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderModal();
  buildThumbs();
}
function closeModal() {
  modalOpen = false;
  document.getElementById('photo-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function nextModal() {
  modalIndex = (modalIndex + 1) % galleryImages.length;
  renderModal();
  syncThumb();
}
function prevModal() {
  modalIndex = (modalIndex - 1 + galleryImages.length) % galleryImages.length;
  renderModal();
  syncThumb();
}
function renderModal() {
  const img = document.getElementById('modal-img');
  img.style.opacity = '0';
  img.src = encodeURI(galleryImages[modalIndex]).replace(/#/g, '%23');
  img.onload = () => { img.style.transition = 'opacity 0.2s'; img.style.opacity = '1'; };
  // Caption from ALL_EVENTS
  const ev = ALL_EVENTS.find(e => e.image === galleryImages[modalIndex]);
  const title = ev ? (lang === 'am' ? ev.titleAm : ev.title) : '';
  img.alt = title;
  document.getElementById('modal-caption').textContent = title;
  document.getElementById('modal-counter').textContent = `${modalIndex + 1} / ${galleryImages.length}`;
}
function buildThumbs() {
  const strip = document.getElementById('modal-thumbs');
  strip.innerHTML = galleryImages.map((img, i) => {
    const ev = ALL_EVENTS.find(e => e.image === img);
    const title = ev ? (lang === 'am' ? ev.titleAm : ev.title) : 'Thumbnail';
    return `
      <div class="photo-modal-thumb${i === modalIndex ? ' active' : ''}" onclick="goThumb(${i})" role="button" aria-label="Go to image ${i+1}">
        <img src="${encodeURI(img).replace(/#/g, '%23')}" alt="${title}" loading="lazy">
      </div>`;
  }).join('');
}
function goThumb(i) {
  modalIndex = i;
  renderModal();
  syncThumb();
}
function syncThumb() {
  document.querySelectorAll('.photo-modal-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === modalIndex);
  });
  // Scroll active thumb into view
  const active = document.querySelector('.photo-modal-thumb.active');
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ── EVENTS ──────────────────────────────────────────
function bindEvents() {
  // Estimator slider
  document.getElementById('est-slider').addEventListener('input', (e) => {
    estimatorGuests = parseInt(e.target.value);
    document.getElementById('est-guest-count').textContent = estimatorGuests;
    updateEstimate();
  });

  // Contact form
  document.getElementById('contact-form').addEventListener('submit', submitContact);

  // Lightbox
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-next').addEventListener('click', nextModal);
  document.getElementById('modal-prev').addEventListener('click', prevModal);
  document.getElementById('photo-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('photo-modal')) closeModal();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!modalOpen) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevModal();
    if (e.key === 'ArrowRight') nextModal();
  });

  // Nav scroll effect + parallax + reveal
  window.addEventListener("scroll", onScroll, { passive: true });
  initScrollReveal();
  initParallax();

}

// ── PARALLAX & SCROLL REVEAL ──────────────────────────────

function onScroll() {
  const header = document.querySelector('header');
  header.style.boxShadow = window.scrollY > 20 ? '0 1px 3px rgba(0,0,0,0.1)' : '';
  runParallax();
  runScrollReveal();
}

// Remove old scroll handler duplicate (already replaced above)
// Elements for parallax
function initParallax() {
  // Hero bg: moves slower than scroll (classic parallax)
  // Why Us image: slight float on scroll
  // Event cards: subtle depth shift
  runParallax();
}

function runParallax() {
  const scrollY = window.scrollY;

  // 1. Hero background — moves at 40% of scroll speed
  const heroBg = document.querySelector('.hero-bg-img');
  if (heroBg) {
    heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
  }

  // 2. Why Choose Us section — image floats up as you scroll into it
  const whySection = document.getElementById('why-choose-us');
  const whyImg = document.querySelector('.why-img-box');
  if (whySection && whyImg) {
    const rect = whySection.getBoundingClientRect();
    const progress = 1 - (rect.bottom / (rect.height + window.innerHeight));
    const clamp = Math.max(0, Math.min(1, progress));
    whyImg.style.transform = `translateY(${(clamp - 0.5) * -60}px)`;
  }

  // 3. Why bg deco diagonal strip — parallax opposite direction
  const whyBgDeco = document.querySelector('.why-bg-deco');
  if (whyBgDeco && whySection) {
    const rect = whySection.getBoundingClientRect();
    const progress = -rect.top / window.innerHeight;
    whyBgDeco.style.transform = `skewX(12deg) translateX(33%) translateY(${progress * -10}%)`;
  }

  // 4. Vision/Mission blobs — slow drift
  const blob1 = document.querySelector('.vm-bg-blob-1');
  const blob2 = document.querySelector('.vm-bg-blob-2');
  const vmSection = document.getElementById('vision-mission');
  if (blob1 && blob2 && vmSection) {
    const rect = vmSection.getBoundingClientRect();
    const progress = -rect.top / window.innerHeight;
    blob1.style.transform = `translate(${progress * -20}px, ${progress * -30}px)`;
    blob2.style.transform = `translate(${progress * 20}px, ${progress * 30}px)`;
  }

  // 5. Featured event cards — subtle depth on scroll (stagger)
  const eventCards = document.querySelectorAll('.event-card-img img');
  const eventsSection = document.getElementById('featured-events');
  if (eventsSection && eventCards.length) {
    const rect = eventsSection.getBoundingClientRect();
    const progress = -rect.top / (rect.height + window.innerHeight);
    const clamp = Math.max(-0.3, Math.min(0.3, progress));
    eventCards.forEach((img, i) => {
      const stagger = (i % 2 === 0 ? 1 : -1) * 8;
      img.style.transform = `scale(1.08) translateY(${clamp * stagger * 6}px)`;
    });
  }
}

// ── SCROLL REVEAL ─────────────────────────────────────────
function initScrollReveal() {
  // Add reveal class to all major sections and cards
  const targets = [
    '#services .service-card',
    '#vision-mission .vm-card',
    '#vision-mission .goal-card',
    '#featured-events .event-card',
    '#testimonials .testi-card',
    '#faq .faq-box',
    '#budget-estimator .estimator-wrap',
    '#contact .contact-item',
    '#contact .contact-form-box',
  ];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 80}ms`;
    });
  });

  // Section headings
  document.querySelectorAll('.section-title, .vm-main-title, .why-title, .contact-title').forEach(el => {
    el.classList.add('reveal');
  });

  runScrollReveal();
}

function runScrollReveal() {
  document.querySelectorAll('.reveal:not(.revealed)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88) {
      el.classList.add('revealed');
    }
  });
}

// ── ACTIVE NAV HIGHLIGHTING ON SCROLL ────────────────────
function initActiveNav() {
  const sections = ['hero','services','featured-events','why-choose-us','testimonials','faq','gallery','contact'];
  const navLinks = {};
  sections.forEach(id => {
    const a = document.querySelector(`.desktop-nav a[href="#${id}"]`);
    if (a) navLinks[id] = a;
  });

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    let current = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    });
    Object.entries(navLinks).forEach(([id, a]) => {
      a.classList.toggle('active', id === current);
    });
  }, { passive: true });
}


// ── SKIP LINK ─────────────────────────────────────────────
function initSkipLink() {
  const skip = document.createElement('a');
  skip.href = '#services';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
}

// ── SWIPE SUPPORT FOR PHOTO MODAL (mobile) ────────────────
function initModalSwipe() {
  const modal = document.getElementById('photo-modal');
  if (!modal) return;
  let startX = 0, startY = 0;
  modal.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  modal.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) nextModal();
      else prevModal();
    }
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initModalSwipe);
