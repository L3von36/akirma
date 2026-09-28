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
 *  ── HOW TO ACTIVATE THE ADMIN DASHBOARD (Firebase — free plan) ──
 *  The dashboard at /admin.html shows inquiries & subscribers in real
 *  time once Firebase is connected (this is also what stores them).
 *  1. Create a free project at https://console.firebase.google.com
 *  2. Build → Firestore Database → Create database (production mode)
 *  3. Build → Authentication → Sign-in method → enable **Email/Password**
 *     → Users → Add user (e.g. admin@akirma.com + a strong password)
 *  4. Project settings (gear icon) → General → Your apps → Web app (</>)
 *     → copy the firebaseConfig values into FIREBASE below
 *  5. Firestore → Rules → paste:
 *
 *      rules_version = '2';
 *      service cloud.firestore {
 *        match /databases/{database}/documents {
 *          match /inquiries/{doc} {
 *            allow create: if true;                      // visitors submit
 *            allow read, update, delete: if request.auth != null;  // admin only
 *          }
 *          match /subscribers/{doc} {
 *            allow create: if true;
 *            allow read, update, delete: if request.auth != null;
 *          }
 *        }
 *      }
 *
 *  6. Publish rules, then sign in at /admin.html with the email/password
 *     from step 3. Until configured, the dashboard runs in DEMO mode.
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

  // ── Admin dashboard (/admin.html) ─────────────────────────
  ADMIN: {
    // PIN only guards DEMO mode preview. Real security comes from
    // Firebase Authentication once FIREBASE below is configured.
    DEMO_PIN: '2519',
    // Where new inquiries/subscribers are stored when Firebase is on.
    INQUIRIES_COLLECTION:  'inquiries',
    SUBSCRIBERS_COLLECTION: 'subscribers',
  },

  // ── Firebase (activates the admin dashboard data) ─────────
  FIREBASE: {
    apiKey:            'YOUR_API_KEY',
    authDomain:        'YOUR_PROJECT.firebaseapp.com',
    projectId:         'YOUR_PROJECT_ID',
    storageBucket:     'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId:             'YOUR_APP_ID',
  },
};
