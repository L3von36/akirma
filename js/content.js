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
 *      contact:      { phones: [...], whatsapp, email, location: { en, am } }
 *    }
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
  function mergeMapInto(map, list) {
    if (!isObj(map) || !Array.isArray(list)) return;
    Object.keys(map).forEach(function (id) {
      var item = null;
      for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(id)) { item = list[i]; break; } }
      if (item) deepMerge(item, map[id]);
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
        image: String(o.image || 'images/events/photo_2026-01-29_22-06-34.jpg'),
        title: String(o.title || 'Untitled post'), titleAm: String(o.titleAm || o.title || 'አርዕስት ሌለው ጽሑፍ'),
        excerpt: String(o.excerpt || ''), excerptAm: String(o.excerptAm || ''),
        content:   Array.isArray(o.content)   ? o.content.slice()   : [],
        contentAm: Array.isArray(o.contentAm) ? o.contentAm.slice() : [],
      });
    });
    // keep the site's "newest first" order
    list.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  function apply() {
    var ov = mergedOverrides();
    if (!ov) return;

    if (isObj(ov.t)) {
      if (isObj(ov.t.en)) deepMerge(T.en, ov.t.en);
      if (isObj(ov.t.am)) deepMerge(T.am, ov.t.am);
    }
    if (isObj(ov.stats) && Array.isArray(ov.stats.values) && typeof HERO_STATS !== 'undefined') {
      HERO_STATS.length = 0;
      ov.stats.values.forEach(function (v) { HERO_STATS.push(String(v)); });
    }
    if (typeof SERVICES !== 'undefined')      mergeMapInto(ov.services, SERVICES);
    if (typeof ALL_EVENTS !== 'undefined')    mergeMapInto(ov.events, ALL_EVENTS);
    if (typeof BLOG_POSTS !== 'undefined')    mergeBlogInto(ov.blog, BLOG_POSTS);
    if (typeof TESTIMONIALS !== 'undefined')  mergeMapInto(ov.testimonials, TESTIMONIALS);
    if (typeof FAQS !== 'undefined')          mergeMapInto(ov.faqs, FAQS);

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
  apply(); // run immediately — renders happen later on DOMContentLoaded
})();
