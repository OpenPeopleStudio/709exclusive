# Setup Checklist for 709exclusive Commerce Platform

## 1. Database Setup (Supabase)
- [ ] Create Supabase project at https://supabase.com
- [ ] Run all SQL migrations in order:
  - sql/001_init.sql
  - sql/002_rls.sql  
  - sql/003_product_images.sql
  - sql/004_inventory_locking.sql
  - sql/005_reserve_inventory.sql
  - sql/006_finalize_inventory.sql
  - sql/007_sku_semantics.sql
  - sql/008_generate_sku.sql
  - sql/009_inventory_audit.sql
  - sql/010_admin_adjust_inventory.sql
  - sql/011_variant_first_sold.sql
  - sql/012_order_status.sql
  - sql/013_shipping.sql
  - sql/014_create_variant_with_sku.sql

## 2. Environment Variables (.env.local)
- [ ] Copy .env.local.example to .env.local
- [ ] Fill in Supabase credentials
- [ ] Set up Stripe keys
- [ ] Configure Resend API key

## 3. Stripe Setup
- [ ] Create Stripe account
- [ ] Add webhook endpoint: /api/stripe/webhook
- [ ] Enable payment methods (cards)
- [ ] Test webhook connectivity

## 4. Email Setup (Resend)
- [ ] Create Resend account
- [ ] Verify domain for sending emails
- [ ] Configure admin notification email

## 5. Admin User Setup
- [ ] Create initial admin user
- [ ] Set role to 'admin' or 'owner' in profiles table

## 6. Storage Setup (Supabase)
- [ ] Create 'product-images' storage bucket
- [ ] Set bucket to public
- [ ] Configure CORS if needed

## 7. Testing
- [ ] Test checkout flow end-to-end
- [ ] Verify inventory locking works
- [ ] Test admin order management
- [ ] Confirm emails are sending

## 8. Deployment
- [ ] Deploy to Vercel/Netlify
- [ ] Set up production environment variables
- [ ] Configure domain and SSL
- [ ] Set up monitoring and alerts

## 9. Go-Live Checklist
- [ ] Seed initial product catalog
- [ ] Test high-concurrency scenarios
- [ ] Set up customer support processes
- [ ] Configure backup and recovery
- [ ] Enable production logging

---
Generated: Tue Jan 13 13:34:42 NST 2026

