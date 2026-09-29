/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — PUBLISHED CONTENT OVERRIDES (js/site-overrides.js)
 * ═══════════════════════════════════════════════════════════════
 *  Content edited in the admin dashboard (/admin.html → Content) can be
 *  published to EVERY visitor through this file.
 *
 *  HOW TO PUBLISH A CHANGE FOR EVERYONE:
 *  1. Open /admin.html → Content → edit → "Save & Preview"
 *  2. Click "Copy publish snippet" (or "Export JSON")
 *  3. Replace the object below with the copied JSON, e.g:
 *
 *       window.AKIRMA_SITE_OVERRIDES = {
 *         "t": { "en": { "hero": { "headline_main": "New headline" } } }
 *       };
 *
 *  4. Commit & push (or edit this file directly on github.com) → live.
 *
 *  NOTE: overrides are SPARSE — only the fields you changed. Everything
 *  else keeps falling back to js/data.js. Leave the object empty ({})
 *  when no published changes exist.
 * ═══════════════════════════════════════════════════════════════
 */
window.AKIRMA_SITE_OVERRIDES = {};
