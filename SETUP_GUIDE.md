# 🚀 709exclusive Setup Guide

## Overview

You've built a **production-grade resale commerce platform** with inventory locking, SKU intelligence, order lifecycle management, and analytics. This guide will get you from code to live system.

---

## 1. 🗄️ Database Setup (Supabase)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project (choose region closest to your users)
3. Wait for project to be ready (5-10 minutes)

### Run Database Migrations
Execute these SQL files in order via Supabase SQL Editor:

```bash
# Core schema
sql/001_init.sql
sql/002_rls.sql

# Product images
sql/003_product_images.sql

# Inventory locking
sql/004_inventory_locking.sql
sql/005_reserve_inventory.sql
sql/006_finalize_inventory.sql

# SKU intelligence
sql/007_sku_semantics.sql
sql/008_generate_sku.sql

# Inventory audit
sql/009_inventory_audit.sql
sql/010_admin_adjust_inventory.sql
sql/011_variant_first_sold.sql

# Order lifecycle
sql/012_order_status.sql
sql/013_shipping.sql

# SKU creation helper
sql/014_create_variant_with_sku.sql
```

### Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create bucket named `product-images`
3. Set to **Public** bucket
4. Note: No additional CORS config needed for basic usage

---

## 2. 🔐 Environment Variables

### Copy Template
```bash
cp .env.local.example .env.local
```

### Fill in Values

**Supabase (from Dashboard → Settings → API)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Stripe (from [stripe.com](https://stripe.com))**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Email (from [resend.com](https://resend.com))**
```env
RESEND_API_KEY=re_...
```

---

## 3. 💳 Stripe Configuration

### Account Setup
1. Create Stripe account
2. Enable test mode initially
3. Add bank account for payouts (production only)

### Webhook Setup
1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy webhook secret to `.env.local`

### Test Webhook
```bash
# Use Stripe CLI to test locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 4. 📧 Email Setup (Resend)

### Account Setup
1. Create Resend account
2. Verify your domain (e.g., `yourbrand.com`)
3. Get API key from dashboard

### Email Templates
The system sends:
- Order confirmations (paid)
- Shipping notifications (shipped)
- Cancellation notices (cancelled)
- Refund confirmations (refunded)

### Admin Notifications
Update `lib/email.ts` line 135 to your admin email:
```typescript
to: 'admin@yourbrand.com'
```

---

## 5. 👤 Admin User Setup

### Create Initial Admin
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@yourbrand.com', crypt('yourpassword', gen_salt('bf')), now());

-- Get the user ID, then:
INSERT INTO profiles (id, role, full_name)
VALUES ('user-id-here', 'owner', 'Admin User');
```

### Test Admin Access
- Visit `/admin/products`
- Should redirect to login if not authenticated
- Should show admin panel if logged in as admin

---

## 6. 🧪 Testing Checklist

### Core Flows
- [ ] User registration/login
- [ ] Product browsing
- [ ] Add to cart → checkout
- [ ] Payment processing (use test cards)
- [ ] Order confirmation email
- [ ] Admin order management

### Inventory Testing
- [ ] Create product with variants
- [ ] Test stock reservation during checkout
- [ ] Verify oversell prevention
- [ ] Test inventory audit logging

### Admin Features
- [ ] Product CRUD operations
- [ ] Order fulfillment workflow
- [ ] Analytics dashboard
- [ ] Inventory adjustments

### Edge Cases
- [ ] Concurrent checkout attempts
- [ ] Payment failures
- [ ] Order cancellations
- [ ] Inventory adjustments

---

## 7. 🚀 Deployment

### Platform Options
- **Vercel** (recommended - Next.js native)
- **Netlify** (good alternative)
- **Railway** or **Render** (full-stack)

### Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables
Set all production environment variables in your deployment platform.

### Domain Setup
- Point domain to deployment
- Configure SSL certificate
- Update Stripe webhook URL to production domain

---

## 8. 📈 Production Monitoring

### Essential Tools
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **Stripe Dashboard** - Payment monitoring
- **Supabase Dashboard** - Database monitoring

### Key Metrics to Track
- Order conversion rate
- Payment success rate
- Inventory accuracy
- Email delivery rates
- Page load performance

---

## 9. 🔧 Post-Launch Operations

### Initial Catalog Setup
```sql
-- Add your first products via admin UI or direct SQL
-- Focus on high-quality, in-demand items
-- Price competitively but profitably
```

### Customer Support
- Set up support email/phone
- Create FAQ for common questions
- Prepare refund/exchange policies

### Inventory Management
- Regular stock checks
- Monitor slow-moving items
- Plan reordering based on analytics

---

## 🚨 Critical Pre-Launch Checks

### Security
- [ ] All API routes have proper authentication
- [ ] Admin routes require admin role
- [ ] No sensitive data exposed to client
- [ ] HTTPS enabled

### Performance
- [ ] Images optimized
- [ ] Database queries efficient
- [ ] Page load times < 3 seconds
- [ ] Mobile responsive

### Legal
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Refund policy
- [ ] Contact information

---

## 🎯 Success Metrics

**Week 1 Goals:**
- 100% payment success rate
- < 5% cart abandonment
- All emails delivering
- No inventory discrepancies

**Month 1 Goals:**
- Positive profit margins
- > 90% sell-through on new items
- < 24hr fulfillment time
- > 4.5 star customer satisfaction

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**
```bash
npm run build  # Check for TypeScript errors
```

**Database Connection:**
- Verify Supabase credentials
- Check RLS policies aren't blocking queries

**Stripe Webhooks:**
```bash
# Test webhook locally
stripe trigger payment_intent.succeeded
```

**Emails Not Sending:**
- Check Resend API key
- Verify domain authentication
- Check spam folder

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review error logs in deployment platform
3. Test locally with `npm run dev`
4. Check Supabase/Stripe dashboards for issues

**Remember:** This is enterprise-grade code. Test thoroughly before going live!

---

*Generated for 709exclusive - Production Resale Commerce Platform*