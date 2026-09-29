/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — js/content.js
 *  Runtime content layer that makes the landing page editable from
 *  the admin dashboard (/admin.html → Content).
 *
 *  Load order (all pages):
 *    config.js → data.js → site-overrides.js → content.js → shared.js → app.js
 *
 *  Three layers are merged, later wins:
 *    1. Built-in defaults        — js/data.js + js/config.js
 *    2. Published overrides      — window.AKIRMA_SITE_OVERRIDES (js/site-overrides.js)
 *                                  → applies to ALL visitors once committed
 *    3. Admin preview overrides  — localStorage "akirma_content_overrides"
 *                                  → this browser only (instant preview)
 *
 *  Override object shape (always SPARSE — only changed fields):
 *    {
 *      t:            { en: {...}, am: {...} },          // diff of translations
 *      stats:        { values: ["500+", ...] },          // hero stat numbers
 *      services:     { "<id>": { name, nameAm, desc, descAm, features } },
 *      events:       { "<id>": { title, titleAm, category, categoryAm,
 *                                location, locationAm, year, image } },
 *      blog:         { "<id>": { slug, date, read_min, category, categoryAm,
 *                                image, title, titleAm, excerpt, excerptAm,
 *                                content[], contentAm[] , _deleted? } },
 *      testimonials: { "<id>": { quote, quoteAm, author, authorAm, role, roleAm } },
 *      faqs:         { "<id>": { q, qAm, a, aAm } },
 *      contact:      { phones: [...], whatsapp, email, location: { en, am } },
 *      seo:          { home: { title, description }, services: {…}, gallery: {…},
 *                      about: {…}, blog: {…},
 *                      verification: { google, bing } },
 *      aeo:          { description, slogan, priceRange, areaServed,
 *                      knowsAbout[], socials: { facebook, instagram, telegram } }
 *    }
 *
 *  SEO notes: one English title/description per page (search engines index
 *  a single version). applySeo() rewrites <title>, meta[name=description]
 *  and the og:/twitter: equivalents on the matching page at load time.
 *  Blog posts may carry optional seo_title/seo_description — when a post is
 *  open (blog.html#slug) its SEO wins over the page-level blog fields.
 *  seo.verification.google/bing inject the GSC/Bing meta tags on every page
 *  (publish the snippet first so crawlers can see it).
 *
 *  AEO notes (answer engines: ChatGPT, Perplexity, Claude, Gemini, Copilot…):
 *  the HTML files carry HARDCODED JSON-LD — that is what non-JS AI crawlers
 *  (GPTBot, ClaudeBot, PerplexityBot) read. applyAeo() rebuilds those blocks
 *  from the merged data at runtime so admin edits also reach JavaScript-
 *  rendering engines (Googlebot, AI Overviews). For full AI coverage, copy
 *  the generated JSON-LD from the admin AEO tab into the HTML files too.
 *
 *  Blog notes: ids that do not exist in data.js are ADDED as new posts;
 *  an item with _deleted: true is removed from the site. Unknown/new ids
 *  need the full field set (see mergeBlogInto for fallbacks).
 *
 *  Public API — window.AkirmaContent:
 *    apply()            merge all layers into the live data (runs on load)
 *    defaults()         pristine factory content (deep copy, id-keyed maps)
 *    effective()        defaults + published + preview (deep copy)
 *    diff(eff)          sparse override object comparing eff against defaults
 *    save(obj)          store admin preview overrides (localStorage)
 *    stored()           read stored preview overrides
 *    clear()            remove preview overrides
 *    contactInfo()      { phones, whatsapp, email, location:{en,am} } merged
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (typeof T === 'undefined') return; // data.js missing — do nothing

  var KEY = 'akirma_content_overrides';
  var cfg = window.AKIRMA_CONFIG || {};

  /* ── small utils ─────────────────────────────────────── */
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  /** Mutably merge src into target (objects recurse, arrays/scalars replace). */
  function deepMerge(target, src) {
    if (!isObj(src)) return target;
    Object.keys(src).forEach(function (k) {
      if (isObj(src[k]) && isObj(target[k])) deepMerge(target[k], src[k]);
      else target[k] = src[k];
    });
    return target;
  }

  /** Sparse diff: returns only what changed in b vs a (undefined if equal). */
  function diff(a, b) {
    if (isObj(a) && isObj(b)) {
      var out = {}, keys = Object.keys(a).concat(Object.keys(b).filter(function (k) { return !(k in a); }));
      keys.forEach(function (k) {
        if (!(k in a)) { out[k] = b[k]; return; }          // added key
        var d = diff(a[k], b[k]);
        if (d !== undefined) out[k] = d;
      });
      return Object.keys(out).length ? out : undefined;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b) ? undefined : clone(b);
    }
    return a === b ? undefined : clone(b);
  }

  function toMap(list) {
    var m = {};
    (list || []).forEach(function (item) { m[String(item.id)] = clone(item); });
    return m;
  }

  /* ── defaults (captured BEFORE any override is applied) ── */
  var DEFAULTS = {
    t: {
      en: clone(T.en),
      am: clone(T.am),
    },
    stats: {
      values: (typeof HERO_STATS !== 'undefined' && Array.isArray(HERO_STATS)) ? clone(HERO_STATS) : [],
    },
    services:     toMap(typeof SERVICES !== 'undefined' && SERVICES),
    events:       toMap(typeof ALL_EVENTS !== 'undefined' && ALL_EVENTS),
    blog:         toMap(typeof BLOG_POSTS !== 'undefined' && BLOG_POSTS),
    testimonials: toMap(typeof TESTIMONIALS !== 'undefined' && TESTIMONIALS),
    faqs:         toMap(typeof FAQS !== 'undefined' && FAQS),
    contact: {
      phones:   Array.isArray(cfg.PHONES) ? clone(cfg.PHONES) : [],
      whatsapp: cfg.WHATSAPP_NUMBER || '',
      email:    cfg.EMAIL_TO || '',
      location: { en: 'Bole Road, Addis Ababa, Ethiopia', am: 'ቦሌ መንገድ፣ አዲስ አበባ፣ ኢትዮጵያ' },
    },
    // Page-level SEO defaults (mirrors the <title>/meta description in the HTML
    // heads — keep in sync when editing the HTML files directly).
    seo: {
      home: {
        title: 'Akirma Events PLC | #1 Event Organizer in Ethiopia',
        description: "Akirma Events PLC (አክርማ ኢቨንት) is Ethiopia's leading event organizer. Weddings, corporate conferences, cultural events & more in Addis Ababa and nationwide.",
      },
      services: {
        title: 'Our Services | Akirma Events PLC',
        description: 'Akirma Events PLC offers 12 professional event services in Ethiopia — weddings, corporate events, decoration, sound & light, catering, and more in Addis Ababa.',
      },
      gallery: {
        title: 'Gallery | Akirma Events',
        description: 'View our portfolio of successful events across Ethiopia. Corporate, weddings, government ceremonies, and more by Akirma Events PLC.',
      },
      about: {
        title: 'About Us | Akirma Events PLC',
        description: "Learn about Akirma Events PLC — Ethiopia's leading event organizer. Our story, mission, values, and the team behind every unforgettable moment.",
      },
      blog: {
        title: 'News & Tips | Akirma Events PLC',
        description: "Event planning guides, cultural celebration playbooks, and budgeting tips from Akirma Events PLC — Ethiopia's leading event organizer in Addis Ababa.",
      },
      verification: { google: '', bing: '' },
    },
    // AEO (Answer Engine Optimization) — business facts used in the
    // LocalBusiness JSON-LD and the admin "AEO" tab. Keep description/slogan
    // aligned with the hardcoded schema blocks in the HTML heads.
    aeo: {
      description: "Akirma Events PLC is Ethiopia's leading event planning and management company, based on Bole Road in Addis Ababa. Full-service weddings, corporate conferences, government ceremonies, decoration, sound & light, stage & tent rental, catering and more — 500+ events delivered across Ethiopia, up to 20,000 guests.",
      slogan: "Ethiopia's Premier Event Company",
      priceRange: '',
      areaServed: 'Addis Ababa & nationwide across Ethiopia',
      knowsAbout: [
        'Wedding Planning', 'Corporate Events', 'Cultural & Religious Events',
        'Concerts & Festivals', 'Decoration & Setup', 'Advert & Promotion',
        'Event Organization', 'Stage & Tent Rental', 'Sound & Light Supply',
        'Chair & Table Supply', 'Catering Supply', 'Kids Game Material Supply',
      ],
      socials: {
        facebook:  'https://www.facebook.com/share/1CFo9pz9T1/',
        instagram: 'https://www.instagram.com/akirmaevents/',
        telegram:  'https://t.me/akirmaeventsplc',
      },
    },
  };
  // Items keep only editor-managed fields (icons etc. stay in data.js)
  ['services', 'events', 'testimonials', 'faqs'].forEach(function (k) {
    Object.keys(DEFAULTS[k]).forEach(function (id) {
      var item = DEFAULTS[k][id];
      if (k === 'services') {
        DEFAULTS[k][id] = { name: item.name || '', nameAm: item.nameAm || '', desc: item.desc || '', descAm: item.descAm || '', features: Array.isArray(item.features) ? item.features : [] };
      } else if (k === 'events') {
        DEFAULTS[k][id] = { title: item.title || '', titleAm: item.titleAm || '', category: item.category || '', categoryAm: item.categoryAm || '', location: item.location || '', locationAm: item.locationAm || '', year: item.year || '', image: item.image || '' };
      } else if (k === 'blog') {
        DEFAULTS[k][id] = {
          slug: item.slug || '', date: item.date || '', read_min: item.read_min || 4,
          category: item.category || '', categoryAm: item.categoryAm || '',
          image: item.image || '',
          title: item.title || '', titleAm: item.titleAm || '',
          excerpt: item.excerpt || '', excerptAm: item.excerptAm || '',
          seo_title: item.seo_title || '', seo_description: item.seo_description || '',
          content:   Array.isArray(item.content)   ? clone(item.content)   : [],
          contentAm: Array.isArray(item.contentAm) ? clone(item.contentAm) : [],
        };
      } else if (k === 'testimonials') {
        DEFAULTS[k][id] = { quote: item.quote || '', quoteAm: item.quoteAm || '', author: item.author || '', authorAm: item.authorAm || '', role: item.role || '', roleAm: item.roleAm || '' };
      } else if (k === 'faqs') {
        DEFAULTS[k][id] = { q: item.q || '', qAm: item.qAm || '', a: item.a || '', aAm: item.aAm || '' };
      }
    });
  });

  /* ── stored (admin preview) + published overrides ─────── */
  function stored() {
    try {
      var raw = localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : null;
      return isObj(o) ? o : null;
    } catch (e) { return null; }
  }

  function published() {
    return isObj(window.AKIRMA_SITE_OVERRIDES) ? window.AKIRMA_SITE_OVERRIDES : {};
  }

  /** site + preview merged (preview wins). */
  function mergedOverrides() {
    var site = published();
    var local = stored() || {};
    if (!Object.keys(site).length) return local;
    var out = clone(site);
    deepMerge(out, local);
    return out;
  }

  /* ── apply overrides onto the live site data ──────────── */
  /** Templates for brand-new items added in the admin (minimum safe fields
   *  so every renderer on the site can draw them without special cases). */
  var STAR_PATH = 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z';
  var NEW_ITEM_TPL = {
    events: function () {
      return { title: 'New event', titleAm: 'አዲስ ዝግጅት', category: 'Corporate', categoryAm: 'ኮርፖሬት', location: 'Addis Ababa', locationAm: 'አዲስ አበባ', year: String(new Date().getFullYear()), image: 'images/events/photo_2026-01-29_22-06-34.webp', featured: false };
    },
    services: function () {
      return { name: 'New service', nameAm: 'አዲስ አገልግሎት', desc: '', descAm: '', iconName: 'Star', iconPath: STAR_PATH, features: [], order: 999 };
    },
    testimonials: function () {
      return { quote: '', quoteAm: '', author: 'New client', authorAm: '', role: '', roleAm: '', order: 999 };
    },
    faqs: function () {
      return { q: 'New question', qAm: 'አዲስ ጥያቄ', a: '', aAm: '', order: 999 };
    },
  };

  /** Merge an overrides map (keyed by id) into a live site ARRAY:
   *  - {_deleted:true} removes the item from the array
   *  - unknown ids are appended as new items (with template defaults)
   *  - known ids are deep-merged in place
   *  Mirrors the admin editor so full CRUD works for every list. */
  function mergeMapInto(map, list, kind) {
    if (!isObj(map) || !Array.isArray(list)) return;
    var tpl = (NEW_ITEM_TPL[kind] || function () { return {}; });
    var nextId = list.reduce(function (m, p) { return Math.max(m, Number(p.id) || 0); }, 0) + 1;
    Object.keys(map).forEach(function (id) {
      var o = map[id];
      if (!isObj(o)) return;
      var idx = -1, i;
      for (i = 0; i < list.length; i++) { if (String(list[i].id) === String(id)) { idx = i; break; } }
      if (o._deleted) { if (idx >= 0) list.splice(idx, 1); return; }
      if (idx >= 0) { deepMerge(list[idx], o); return; }
      // brand-new item created in the admin
      var item = tpl();
      item.id = Number(id) || nextId++;
      deepMerge(item, o);
      delete item._deleted;
      list.push(item);
    });
  }

  /** Clean an incoming blog override item (dates / numbers / slugs). */
  function sanitizeBlogOv(o) {
    if (o.date != null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(o.date))) delete o.date;
    }
    if (o.read_min != null) {
      var n = Number(o.read_min);
      if (!n || n < 1) delete o.read_min; else o.read_min = Math.round(n);
    }
    if (o.slug != null) {
      var s = String(o.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!s) delete o.slug; else o.slug = s;
    }
  }

  /** Blog overrides: edit existing posts, add new ids, remove _deleted ones.
   *  Unlike mergeMapInto this also APPENDS new posts and sorts by date desc. */
  function mergeBlogInto(map, list) {
    if (!isObj(map) || !Array.isArray(list)) return;
    var nextId = list.reduce(function (m, p) { return Math.max(m, Number(p.id) || 0); }, 0) + 1;
    Object.keys(map).forEach(function (id) {
      var o = map[id];
      if (!isObj(o)) return;
      sanitizeBlogOv(o);
      var idx = -1, i;
      for (i = 0; i < list.length; i++) { if (String(list[i].id) === String(id)) { idx = i; break; } }
      if (o._deleted) { if (idx >= 0) list.splice(idx, 1); return; }
      if (idx >= 0) {
        deepMerge(list[idx], o);
        if (list[idx].read_min != null) list[idx].read_min = Number(list[idx].read_min) || 4;
        return;
      }
      // brand-new post (needs a minimum of fields to render safely)
      var nid = Number(id) || nextId++;
      list.push({
        id: nid,
        slug: String(o.slug || ('post-' + nid)),
        date: String(o.date || new Date().toISOString().slice(0, 10)),
        read_min: Number(o.read_min) || 4,
        category: String(o.category || 'Tips'), categoryAm: String(o.categoryAm || 'ምክር'),
        image: String(o.image || 'images/events/photo_2026-01-29_22-06-34.webp'),
        title: String(o.title || 'Untitled post'), titleAm: String(o.titleAm || o.title || 'አርዕስት ሌለው ጽሑፍ'),
        excerpt: String(o.excerpt || ''), excerptAm: String(o.excerptAm || ''),
        seo_title: String(o.seo_title || ''), seo_description: String(o.seo_description || ''),
        content:   Array.isArray(o.content)   ? o.content.slice()   : [],
        contentAm: Array.isArray(o.contentAm) ? o.contentAm.slice() : [],
      });
    });
    // keep the site's "newest first" order
    list.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  /* ── SEO: which page is this? + apply meta overrides ───── */
  function pageId() {
    var p = String(location.pathname || '').split('/').pop();
    if (!p || p === 'index.html') return 'home';
    var m = p.match(/^([a-z]+)\.html$/i);
    return m ? m[1].toLowerCase() : '';
  }

  /** Write title/description into the document head (page + post SEO). */
  function setSeoTags(title, desc) {
    if (title) {
      document.title = title;
      ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.setAttribute('content', title);
      });
    }
    if (desc) {
      ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.setAttribute('content', desc);
      });
    }
  }

  /** Rewrite <title>, meta description + og:/twitter: tags for THIS page. */
  function applySeo(ov) {
    if (!isObj(ov)) return;
    var o = ov[pageId()];
    if (!isObj(o)) return;
    setSeoTags(
      (typeof o.title === 'string' && o.title.trim()) ? o.title.trim() : null,
      (typeof o.description === 'string' && o.description.trim()) ? o.description.trim() : null
    );
  }

  /** Effective page-level SEO (defaults + overrides) for fallback/restore. */
  function effectiveSeoFor(page) {
    var base = DEFAULTS.seo[page] || {};
    var ov = mergedOverrides();
    var o = (ov && isObj(ov.seo) && isObj(ov.seo[page])) ? ov.seo[page] : {};
    return {
      title:       (typeof o.title === 'string' && o.title) || base.title || '',
      description: (typeof o.description === 'string' && o.description) || base.description || '',
    };
  }

  /** Per-post SEO: when blog.html#slug is open, that post's fields win. */
  function applyBlogSeo() {
    if (pageId() !== 'blog' || typeof BLOG_POSTS === 'undefined' || !Array.isArray(BLOG_POSTS)) return;
    var slug = '';
    try { slug = decodeURIComponent(String(location.hash || '').replace(/^#/, '')).trim(); } catch (e) {}
    var post = null;
    if (slug) {
      for (var i = 0; i < BLOG_POSTS.length; i++) {
        if (String(BLOG_POSTS[i].slug) === slug) { post = BLOG_POSTS[i]; break; }
      }
    }
    if (post && ((post.seo_title || '').trim() || (post.seo_description || '').trim())) {
      var page = effectiveSeoFor('blog');
      setSeoTags(
        (post.seo_title || '').trim() || page.title || null,
        (post.seo_description || '').trim() || page.description || null
      );
    } else if (!post) {
      // back on the grid → restore the page-level blog SEO
      var p2 = effectiveSeoFor('blog');
      setSeoTags(p2.title || null, p2.description || null);
    }
  }

  /** Inject Google Search Console / Bing verification metas (all pages). */
  function applyVerification(v) {
    if (!isObj(v)) return;
    [['google', 'google-site-verification'], ['bing', 'msvalidate.01']].forEach(function (pair) {
      var val = String(v[pair[0]] || '').trim();
      if (!val) return;
      var m = val.match(/content\s*=\s*["']([^"']+)["']/i); // accept a pasted <meta …> tag
      if (m) val = m[1].trim();
      if (!val) return;
      var el = document.querySelector('meta[name="' + pair[1] + '"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', pair[1]);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    });
  }

  /* ── AEO: schema.org JSON-LD for answer engines ────────────
   * Rebuilds the (hardcoded) JSON-LD blocks from merged data so admin edits
   * flow into JavaScript-rendering engines. Blocks patched when present:
   *   script[data-akirma="business"] — LocalBusiness full node (index.html)
   *   #ld-faq      — FAQPage  (index.html, from merged FAQS)
   *   #ld-services — ItemList (services.html, from merged SERVICES)
   *   #ld-blog     — Blog     (blog.html, from merged BLOG_POSTS)      */
  var BASE_URL = 'https://akirmaevents.com';

  function cleanList(list) {
    return (Array.isArray(list) ? list : []).map(function (s) { return String(s || '').trim(); }).filter(Boolean);
  }
  function cleanTel(t) { return String(t || '').replace(/[^\d+]/g, ''); }

  /** Effective aeo + contact slice (defaults ← published ← preview). */
  function aeoEff() {
    var eff = { aeo: clone(DEFAULTS.aeo), contact: clone(DEFAULTS.contact) };
    var ov = mergedOverrides() || {};
    if (isObj(ov.aeo)) deepMerge(eff.aeo, ov.aeo);
    if (isObj(ov.contact)) deepMerge(eff.contact, ov.contact);
    return eff;
  }

  /** Full LocalBusiness node (mirrors the hardcoded block in index.html). */
  function businessSchema(eff) {
    eff = eff || aeoEff();
    var a = eff.aeo || {}, c = eff.contact || {};
    var tels = cleanList(c.phones).map(cleanTel);
    var node = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': BASE_URL + '/#business',
      name: 'Akirma Events PLC',
      image: BASE_URL + '/images/hero-bg.jpg',
      url: BASE_URL + '/',
      telephone: tels,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bole Road',
        addressLocality: 'Addis Ababa',
        addressCountry: 'ET',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 9.020284, longitude: 38.869465 },
      hasMap: 'https://maps.app.goo.gl/BcCbqGoLpcCEfZpz7',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00',
      },
    };
    var slogan = String(a.slogan || '').trim();
    if (slogan) node.slogan = slogan;
    var desc = String(a.description || '').trim();
    if (desc) node.description = desc;
    var area = String(a.areaServed || '').trim();
    if (area) node.areaServed = area;
    var ka = cleanList(a.knowsAbout);
    if (ka.length) node.knowsAbout = ka;
    if (tels.length) node.contactPoint = { '@type': 'ContactPoint', contactType: 'customer service', telephone: tels, availableLanguage: ['English', 'Amharic'] };
    var sameAs = cleanList([a.socials && a.socials.facebook, a.socials && a.socials.instagram, a.socials && a.socials.telegram]);
    if (sameAs.length) node.sameAs = sameAs;
    var pr = String(a.priceRange || '').trim();
    if (pr) node.priceRange = pr;
    return node;
  }

  /** FAQPage from the merged FAQ list (English — one indexed version). */
  function faqSchema() {
    if (typeof FAQS === 'undefined' || !Array.isArray(FAQS)) return null;
    var items = FAQS.map(function (f) {
      var q = String(f.q || '').trim(), a = String(f.a || '').trim();
      return (q && a) ? { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } } : null;
    }).filter(Boolean);
    return items.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': BASE_URL + '/#faq', mainEntity: items } : null;
  }

  /** Service catalog for the Services page (feeds "what do they offer" answers). */
  function servicesSchema() {
    if (typeof SERVICES === 'undefined' || !Array.isArray(SERVICES)) return null;
    var items = SERVICES.map(function (s, i) {
      var name = String(s.name || '').trim();
      if (!name) return null;
      var item = { '@type': 'Service', name: name, serviceType: name, provider: { '@type': 'LocalBusiness', '@id': BASE_URL + '/#business', name: 'Akirma Events PLC' }, areaServed: 'Ethiopia', url: BASE_URL + '/services.html' };
      var d = String(s.desc || '').trim();
      if (d) item.description = d;
      return { '@type': 'ListItem', position: i + 1, item: item };
    }).filter(Boolean);
    return items.length ? { '@context': 'https://schema.org', '@type': 'ItemList', '@id': BASE_URL + '/services.html#services', name: 'Event services by Akirma Events PLC', itemListElement: items } : null;
  }

  /** Blog + postings (lets AI engines cite individual guides). */
  function blogSchema() {
    if (typeof BLOG_POSTS === 'undefined' || !Array.isArray(BLOG_POSTS)) return null;
    var posts = BLOG_POSTS.map(function (p) {
      var slug = String(p.slug || '').trim(), headline = String(p.title || '').trim();
      if (!slug || !headline) return null;
      var node = { '@type': 'BlogPosting', headline: headline, url: BASE_URL + '/blog.html#' + encodeURIComponent(slug), author: { '@type': 'Organization', name: 'Akirma Events PLC' } };
      var d = String(p.date || '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) node.datePublished = d;
      if (p.image && !/^data:/i.test(String(p.image))) { try { node.image = encodeURI(BASE_URL + '/' + String(p.image)); } catch (e) {} }
      return node;
    }).filter(Boolean);
    return posts.length ? { '@context': 'https://schema.org', '@type': 'Blog', '@id': BASE_URL + '/blog.html#blog', name: 'News & Tips | Akirma Events PLC', url: BASE_URL + '/blog.html', publisher: { '@type': 'LocalBusiness', '@id': BASE_URL + '/#business', name: 'Akirma Events PLC' }, blogPost: posts } : null;
  }

  /** Replace the body of a JSON-LD script block (if present on this page). */
  function patchSchema(selector, node) {
    if (!node) return;
    var el = document.querySelector(selector);
    if (!el) return;
    try { el.textContent = JSON.stringify(node, null, 2); } catch (e) {}
  }

  function applyAeo(eff) {
    patchSchema('script[data-akirma="business"]', businessSchema(eff));
    patchSchema('#ld-faq', faqSchema());
    patchSchema('#ld-services', servicesSchema());
    patchSchema('#ld-blog', blogSchema());
  }

  /** blog.html opens/closes posts via history.replaceState → no hashchange
   *  event. Patch replaceState (and listen to hashchange for direct edits)
   *  so per-post SEO always matches the visible article. */
  function watchBlogUrl() {
    if (window.history && typeof history.replaceState === 'function' && !history.__akirmaPatched) {
      var rs = history.replaceState;
      history.replaceState = function () {
        var r = rs.apply(this, arguments);
        try { if (pageId() === 'blog') applyBlogSeo(); } catch (e) {}
        return r;
      };
      try { history.__akirmaPatched = true; } catch (e) {}
    }
    window.addEventListener('hashchange', function () {
      if (pageId() === 'blog') applyBlogSeo();
    });
  }

  function apply() {
    var ov = mergedOverrides();
    if (!ov) return;
    applySeo(ov.seo);
    applyVerification(isObj(ov.seo) ? ov.seo.verification : null);

    if (isObj(ov.t)) {
      if (isObj(ov.t.en)) deepMerge(T.en, ov.t.en);
      if (isObj(ov.t.am)) deepMerge(T.am, ov.t.am);
    }
    if (isObj(ov.stats) && Array.isArray(ov.stats.values) && typeof HERO_STATS !== 'undefined') {
      HERO_STATS.length = 0;
      ov.stats.values.forEach(function (v) { HERO_STATS.push(String(v)); });
    }
    if (typeof SERVICES !== 'undefined')      mergeMapInto(ov.services, SERVICES, 'services');
    if (typeof ALL_EVENTS !== 'undefined')    mergeMapInto(ov.events, ALL_EVENTS, 'events');
    if (typeof BLOG_POSTS !== 'undefined')    mergeBlogInto(ov.blog, BLOG_POSTS);
    if (typeof TESTIMONIALS !== 'undefined')  mergeMapInto(ov.testimonials, TESTIMONIALS, 'testimonials');
    if (typeof FAQS !== 'undefined')          mergeMapInto(ov.faqs, FAQS, 'faqs');
    applyBlogSeo(); // after the blog merge above — posts may carry SEO fields
    applyAeo(aeoEff()); // rebuild the JSON-LD blocks from the merged data

    if (isObj(ov.contact)) {
      var c = ov.contact;
      if (typeof c.whatsapp === 'string' && c.whatsapp.trim()) cfg.WHATSAPP_NUMBER = c.whatsapp.replace(/[^0-9]/g, '');
      if (Array.isArray(c.phones)) cfg.PHONES = c.phones.slice();
      if (typeof c.email === 'string' && c.email.trim()) cfg.EMAIL_TO = c.email.trim();
      if (isObj(c.location)) window.AKIRMA_LOCATION_TEXT = clone(c.location);
    }
  }

  /* ── public API ───────────────────────────────────────── */
  var api = { apply: apply, diff: diff, KEY: KEY };

  api.defaults = function () { return clone(DEFAULTS); };

  api.effective = function () {
    var eff = clone(DEFAULTS);
    deepMerge(eff, mergedOverrides());
    return eff;
  };

  /** Sparse overrides for a (possibly edited) effective object. */
  api.diffFromDefaults = function (eff) { return diff(DEFAULTS, eff || api.effective()) || {}; };

  api.save = function (eff) {
    var sparse = api.diffFromDefaults(eff);
    try {
      if (Object.keys(sparse).length) localStorage.setItem(KEY, JSON.stringify(sparse));
      else localStorage.removeItem(KEY);
    } catch (e) { return { ok: false, error: e.message }; }
    return { ok: true, overrides: sparse };
  };

  api.stored = stored;
  api.clear = function () { try { localStorage.removeItem(KEY); } catch (e) {} };

  /** Merge an (imported) sparse override object into a working copy. */
  api.deepMergeInto = function (target, src) { return deepMerge(target, src); };

  /** LocalBusiness JSON-LD node (admin AEO tab preview + copy-to-HTML). */
  api.businessSchema = function (eff) { return businessSchema(eff || aeoEff()); };

  /** Merged contact info for rendering (phones/whatsapp/email/location). */
  api.contactInfo = function () {
    var eff = api.effective().contact;
    return {
      phones: (eff.phones || []).filter(Boolean),
      whatsapp: eff.whatsapp || '',
      email: eff.email || '',
      location: eff.location || { en: '', am: '' },
    };
  };

  window.AkirmaContent = api;
  watchBlogUrl();
  apply(); // run immediately — renders happen later on DOMContentLoaded
})();
