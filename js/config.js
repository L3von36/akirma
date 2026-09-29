/**
 * ═══════════════════════════════════════════════════════════════
 *  AKIRMA EVENTS — SITE CONFIGURATION (js/config.js)
 * ═══════════════════════════════════════════════════════════════
 *  This is the ONE place to configure contact & integration settings.
 *
 *  ── HOW TO ACTIVATE REAL EMAIL SENDING (EmailJS — free plan) ──
 *  1. Create a free account at https://www.emailjs.com
 *  2. "Email Services" → connect the company mailbox (e.g. info@akirma.com)
 *     → copy the **Service ID**
 *  3. "Email Templates" → create a CONTACT template that uses these
 *     variables:  {{from_name}} {{from_email}} {{phone}} {{event_type}}
 *                 {{event_date}} {{message}} {{to_name}}
 *     → copy the **Template ID**
 *  4. Create a second NEWSLETTER template using:  {{subscriber_email}}
 *     → copy that **Template ID** too
 *  5. "Account → API Keys" → copy the **Public Key**
 *  6. Paste the four values below (replace the YOUR_... placeholders).
 *
 *  ✅ As soon as the placeholders are replaced, the contact form and
 *     the footer newsletter start sending real emails automatically.
 *
 *  ⚠️  UNTIL THEN the contact form falls back to WhatsApp: submissions
 *      open as a pre-filled WhatsApp message to WHATSAPP_NUMBER, so no
 *      inquiry is ever lost. The newsletter falls back to the visitor's
 *      mail app addressed to EMAIL_TO.
 *
 *  ── HOW THE ADMIN DASHBOARD WORKS (no third-party service) ──
 *  The dashboard at /admin.html is powered by the site's own API
 *  (Cloudflare Worker + KV, see worker.js):
 *  - Booking inquiries POST to /api/inquiry from the contact form;
 *    newsletter signups POST to /api/subscriber from the footer form.
 *  - Sign-in at /admin.html uses the admin PIN, verified server-side
 *    against the Worker secret ADMIN_PIN:
 *        npx wrangler secret put ADMIN_PIN
 *    (the PIN is never stored in this public bundle).
 *  - Successful sign-in returns a short-lived session token; admin
 *    data endpoints require it as a Bearer token.
 * ═══════════════════════════════════════════════════════════════
 */
window.AKIRMA_CONFIG = {

  // ── EmailJS credentials ──────────────────────────────────
  EMAILJS: {
    SERVICE_ID:             'YOUR_SERVICE_ID',             // e.g. 'service_abc123'
    TEMPLATE_ID:            'YOUR_TEMPLATE_ID',            // contact form template
    NEWSLETTER_TEMPLATE_ID: 'YOUR_NEWSLETTER_TEMPLATE_ID', // newsletter template
    PUBLIC_KEY:             'YOUR_PUBLIC_KEY',             // e.g. 'aBc123XyZ'
  },

  // ── Direct channels (used for fallbacks & quick buttons) ─
  WHATSAPP_NUMBER: '251915843131',              // digits only — no "+", spaces or dashes
  TELEGRAM_URL:    'https://t.me/akirmaeventsplc',
  EMAIL_TO:        'info@akirma.com',           // company inbox for mailto fallbacks

  // ── Company phone numbers (shown on the site, tap-to-call) ─
  PHONES: [
    '+251 910 977 371',
    '+251 915 843 131',
    '+251 915 895 757',
  ],

  // ── Booking inquiries (site API) ─────────────────────────
  // When true, "Send Inquiry" on the contact form POSTs the booking to the
  // site's own API (Cloudflare Worker + KV, see worker.js). Inquiries then
  // appear in the admin dashboard at /admin.html — no third-party service
  // needed. The dedicated "Send via WhatsApp" button is unaffected.
  // Set to false only if you ever move the site off this Worker.
  SERVER_API: true,

  // ── Admin dashboard (/admin.html) ─────────────────────────
  ADMIN: {
    // SECURITY: the admin PIN is NOT stored here. It lives only in the
    // Cloudflare Worker secret ADMIN_PIN (npx wrangler secret put ADMIN_PIN)
    // and is verified server-side by POST /api/admin/login — nothing secret
    // ships in this public bundle.
  },
};
