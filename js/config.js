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
};
