# 709exclusive Environment Variables Setup

## 📋 Required Environment Variables

Copy the template below and create a `.env.local` file in your project root.

```bash
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =============================================================================
# STRIPE PAYMENT PROCESSING
# =============================================================================
# Get these from: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# EMAIL SERVICE (Choose one)
# =============================================================================

# Option 1: SendGrid (Recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# Option 2: Postmark (Alternative)
POSTMARK_API_KEY=your_postmark_api_key_here

# Option 3: Resend (Legacy)
RESEND_API_KEY=re_your_resend_api_key_here

# =============================================================================
# GOOGLE IMAGE SEARCH (Optional - for product images)
# =============================================================================
# Get these from: https://console.developers.google.com/
GOOGLE_IMAGE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id_here

# =============================================================================
# APPLICATION URL (for email links)
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Quick Setup Commands

```bash
# 1. Copy this template to create your .env.local file
cp ENVIRONMENT_SETUP.md .env.local

# 2. Edit the file with your actual values
# (The file above contains the template - copy it manually)

# 3. Start development server
npm run dev
```

## 📚 Where to Get API Keys

### Supabase
1. Go to [supabase.com](https://app.supabase.com)
2. Create/select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public keys
5. Copy the service_role key (keep this secret!)

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your test keys (pk_test_... and sk_test_...)
4. Create a webhook endpoint for checkout confirmation
5. Copy the webhook signing secret

### SendGrid (Email)
1. Go to [SendGrid](https://app.sendgrid.com)
2. Create an API key with full access
3. Copy the key (starts with SG.)
4. Verify your domain for better deliverability

### Google Image Search (Optional)
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a project or select existing
3. Enable Custom Search JSON API
4. Create credentials (API key)
5. Create a Custom Search Engine
6. Copy the Search Engine ID

## ✅ Setup Checklist

- [ ] `.env.local` file created
- [ ] Supabase credentials added
- [ ] Stripe credentials added
- [ ] Email service configured
- [ ] Application tested with `npm run dev`

## 🔒 Security Notes

- Never commit `.env.local` to git
- Use test keys for development
- Rotate keys regularly in production
- Store production keys securely

## 🆘 Troubleshooting

**Error: "NEXT_PUBLIC_SUPABASE_URL is required"**
→ Check your Supabase project URL and keys

**Error: "Invalid API key"**
→ Verify your Stripe/SendGrid keys are correct

**Email not sending**
→ Check domain verification in SendGrid dashboard

---

*This file is safe to commit to git as it contains no actual secrets.*