# 709exclusive - E-Commerce Platform Documentation

> Production-grade resale commerce platform with inventory management, SKU intelligence, and order lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Functionality Inventory](#functionality-inventory)
- [API Reference](#api-reference)
- [Admin Features](#admin-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

709exclusive is a complete e-commerce platform built for resale operations. It features:

- **User Authentication** - Supabase Auth with role-based access (customer, admin, owner)
- **Product Management** - Products, variants, images, SKU generation
- **Inventory System** - Real-time stock tracking with reservation-based oversell protection
- **Order Lifecycle** - Full workflow from checkout to fulfillment to shipping
- **Payment Processing** - Stripe integration with webhook handling
- **Email Notifications** - SendGrid transactional emails (order confirmation, shipping, etc.)
- **Admin Dashboard** - Product CRUD, order management, inventory adjustments, analytics
- **Image Import** - Google Image Search integration for product photography

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | PostgreSQL (Supabase) with RLS |
| Auth | Supabase Auth |
| Payments | Stripe |
| Email | SendGrid |
| Storage | Supabase Storage |
| Hosting | Vercel (recommended) |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd 709exclusive
npm install
```

### 2. Environment Setup

Create `.env.local` with required variables (see [Environment Variables](#environment-variables)).

### 3. Database Setup

Run SQL migrations in Supabase SQL Editor (see [Database Setup](#database-setup)).

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# =============================================================================
# SUPABASE - Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# =============================================================================
# STRIPE - Get from: https://dashboard.stripe.com/apikeys
# =============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# =============================================================================
# EMAIL (SendGrid) - Get from: https://app.sendgrid.com
# =============================================================================
SENDGRID_API_KEY=SG.your_api_key

# =============================================================================
# GOOGLE IMAGE SEARCH (Optional) - Get from: https://console.developers.google.com
# =============================================================================
GOOGLE_IMAGE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# =============================================================================
# GOOGLE VISION OCR (Optional) - Enable the Vision API in Google Cloud
# =============================================================================
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# =============================================================================
# APPLICATION
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRIVACY_STRICT_LOGGING=true
```

### Security Notes

- **Never commit `.env.local` to git** (it's in `.gitignore`)
- Use test keys for development
- Rotate keys regularly in production
- Screenshot OCR requires the Google Vision API to be enabled for the API key.
- `PRIVACY_STRICT_LOGGING=true` reduces error detail returned by message APIs.

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project to initialize

### 2. Run Migrations

Execute these SQL files in order via Supabase SQL Editor:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `sql/001_init.sql` | Core tables (profiles, products, variants, orders) |
| 2 | `sql/002_rls.sql` | Row-level security policies |
| 3 | `sql/003_product_images.sql` | Product images table |
| 4 | `sql/004_inventory_locking.sql` | Inventory reservation system |
| 5 | `sql/005_reserve_inventory.sql` | Reserve inventory function |
| 6 | `sql/006_finalize_inventory.sql` | Finalize inventory after payment |
| 7 | `sql/007_sku_semantics.sql` | SKU fields (brand, model, condition_code) |
| 8 | `sql/008_generate_sku.sql` | SKU generation function |
| 9 | `sql/009_inventory_audit.sql` | Audit trail table |
| 10 | `sql/010_admin_adjust_inventory.sql` | Admin inventory adjustment |
| 11 | `sql/011_variant_first_sold.sql` | First sale tracking |
| 12 | `sql/012_order_status.sql` | Order status enum and timestamps |
| 13 | `sql/013_shipping.sql` | Shipping fields |
| 14 | `sql/014_create_variant_with_sku.sql` | Variant creation helper |
| 15 | `sql/015_model_images.sql` | Product model images |

**Alternative**: Use `all_migrations.sql` to run all migrations at once.

### 3. Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create bucket named `product-images` (public)
3. Create bucket named `model-images` (public)
4. Create bucket named `message-attachments` (private)

### 4. Create Admin User

See [sql/add_admin_user.sql](sql/add_admin_user.sql) for SQL to create your first admin user.

---

## Functionality Inventory

### Frontend Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Home page with navigation |
| `/cart` | `app/cart/page.tsx` | Shopping cart |
| `/checkout` | `app/checkout/page.tsx` | Checkout flow |
| `/product/[slug]` | `app/product/[slug]/page.tsx` | Product detail |
| `/account/orders` | `app/account/orders/page.tsx` | Customer order history |
| `/account/orders/[id]` | `app/account/orders/[id]/page.tsx` | Order detail |

### Admin Pages

| Route | File | Description |
|-------|------|-------------|
| `/admin/products` | `app/admin/products/page.tsx` | Product list & management |
| `/admin/products/new` | `app/admin/products/new/page.tsx` | Create new product |
| `/admin/models` | `app/admin/models/page.tsx` | Model management |
| `/admin/models/[id]/images` | `app/admin/models/[id]/images/page.tsx` | Model image management |
| `/admin/inventory` | `app/admin/inventory/page.tsx` | Inventory overview |
| `/admin/orders` | `app/admin/orders/page.tsx` | Order management |
| `/admin/customers` | `app/admin/customers/page.tsx` | Customer list |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Create order & payment intent |
| POST | `/api/stripe/webhook` | Handle Stripe events |
| GET | `/api/orders` | List user's orders |
| GET | `/api/orders/[id]` | Get order detail |

### Admin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products/create` | Create product |
| GET | `/api/admin/inventory` | Get inventory overview |
| POST | `/api/admin/inventory/adjust` | Adjust stock |
| GET | `/api/admin/orders` | List all orders |
| POST | `/api/admin/orders/fulfill` | Mark order fulfilled |
| POST | `/api/admin/orders/ship` | Mark order shipped |
| POST | `/api/admin/orders/cancel` | Cancel order |
| POST | `/api/admin/orders/refund` | Refund order |
| GET | `/api/admin/models` | List product models |
| POST | `/api/admin/models` | Create model |
| GET | `/api/admin/models/[id]` | Get model detail |
| GET | `/api/admin/models/[id]/images` | Get model images |
| POST | `/api/admin/models/google-search` | Search Google for images |
| POST | `/api/admin/models/import-images` | Import images to storage |
| GET | `/api/admin/analytics` | Get analytics data |

### Library Functions

| File | Functions | Purpose |
|------|-----------|---------|
| `lib/auth.ts` | `getCurrentUser`, `getUserProfile` | User authentication |
| `lib/cart.ts` | `getCart`, `addToCart`, `removeFromCart`, etc. | Cart management |
| `lib/inventory.ts` | `getVariantAvailability`, `adjustInventory` | Inventory operations |
| `lib/models.ts` | `getModelImages`, `getModelsByBrand` | Model queries |
| `lib/drops.ts` | `getDropStatus`, `formatTimeRemaining` | Drop scheduling |
| `lib/roles.ts` | `isAdmin` | Role checking |
| `lib/storage.ts` | `uploadProductImage`, `deleteProductImage` | Image storage |
| `lib/stripe.ts` | Stripe client instance | Payment processing |
| `lib/email/index.ts` | Email exports | Email sending |
| `lib/email/sendgrid.ts` | SendGrid implementations | Order emails |
| `lib/imageSources/google.ts` | `searchGoogleImages` | Google image search |
| `lib/imageSources/importImage.ts` | `importImageToStorage` | Import external images |

### Database Tables

| Table | Description |
|-------|-------------|
| `709_profiles` | User profiles with roles |
| `products` | Product catalog |
| `product_variants` | Product variants (SKU, size, condition, price, stock) |
| `product_images` | Product images |
| `product_models` | Reusable product models (brand + model) |
| `model_images` | Images for product models |
| `orders` | Customer orders |
| `order_items` | Line items for orders |
| `inventory_audit` | Inventory change audit trail |

### Database Functions

| Function | Purpose |
|----------|---------|
| `reserve_inventory` | Reserve stock during checkout |
| `finalize_inventory` | Commit reservation after payment |
| `release_reserved_inventory` | Release reservation on failure |
| `release_abandoned_reservations` | Cleanup stale reservations |
| `admin_adjust_inventory` | Admin stock adjustments |
| `generate_sku` | Generate deterministic SKU |
| `create_variant_with_sku` | Create variant with auto-SKU |
| `update_first_sold_at` | Track first sale timestamp |

---

## API Reference

### POST /api/checkout

Create a new order and Stripe payment intent.

**Request:**
```json
{
  "items": [
    { "variant_id": "uuid", "qty": 1 }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "city": "Toronto",
    "province": "ON",
    "postal_code": "M5V 1A1",
    "country": "CA"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "orderId": "uuid"
}
```

### POST /api/stripe/webhook

Handles Stripe webhook events:
- `payment_intent.succeeded` → Finalize order, send confirmation
- `payment_intent.payment_failed` → Release reservations
- `payment_intent.canceled` → Release reservations

---

## Admin Features

### Product Management

- Create products with multiple variants
- Auto-generate SKUs (BRAND-MODEL-SIZE-CONDITION-HASH)
- Upload product images
- Set drop dates for limited releases

### Inventory Management

- View real-time stock levels (stock, reserved, available)
- Adjust inventory with audit trail
- Release stuck reservations
- Analytics: sell-through rate, days-to-first-sale
- Import inventory from CSVs or screenshots (OCR)

### Order Management

- View all orders with status
- Fulfill orders (mark as picked/packed)
- Ship orders (add tracking number)
- Cancel orders (before shipment)
- Refund orders (after payment)

### Image Import

- Search Google Images for product photos
- Import to Supabase Storage
- Assign to product models

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard.

### Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` to production domain
2. Configure Stripe webhook for production: `https://yourdomain.com/api/stripe/webhook`
3. Verify SendGrid domain authentication

---

## Troubleshooting

### 404 Errors in Production

1. Ensure all API routes are in `app/api/` directory
2. Check that Vercel has rebuilt after changes
3. Verify environment variables are set in production

### Build Failures

```bash
npm run build
```

Check for TypeScript errors in the output.

### Database Connection Issues

- Verify Supabase credentials in environment variables
- Check RLS policies aren't blocking queries
- Ensure migrations ran successfully

### Stripe Webhooks Not Working

```bash
# Test locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger payment_intent.succeeded
```

### Emails Not Sending

- Verify SendGrid API key
- Check domain authentication in SendGrid dashboard
- Monitor SendGrid activity feed

---

## Project Structure

```
709exclusive/
├── app/                      # Next.js App Router
│   ├── account/              # Customer account pages
│   ├── admin/                # Admin dashboard pages
│   ├── api/                  # API routes
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Checkout flow
│   ├── product/              # Product pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── context/                  # React context providers
│   └── CartContext.tsx       # Cart state management
├── lib/                      # Shared utilities
│   ├── email/                # Email providers
│   ├── imageSources/         # Image import utilities
│   └── *.ts                  # Various utilities
├── public/                   # Static assets
├── sql/                      # Database migrations
├── types/                    # TypeScript definitions
└── supabase/                 # Supabase config
```

---

## Support

For issues:
1. Check this documentation
2. Review error logs
3. Test locally with `npm run dev`
4. Check Supabase/Stripe dashboards

---

*709exclusive - Production-Grade E-Commerce Platform*
