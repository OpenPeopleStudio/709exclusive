# 709exclusive - Multi-Tenant E-Commerce Platform

Production-grade SaaS platform for resale commerce with multi-tenant isolation, inventory management, and privacy-first features.

## Features

- **Multi-Tenant SaaS** - Complete tenant isolation with custom domains and theming
- **Inventory Management** - Real-time stock tracking with reservation-based oversell protection
- **Order Lifecycle** - Checkout → Payment → Fulfillment → Shipping with webhook automation
- **Payment Processing** - Stripe integration with card and crypto (NOWPayments) support
- **Privacy-First** - GDPR/CCPA/PIPEDA compliant with data export and deletion
- **Admin Dashboard** - Tenant-scoped admin + super admin for platform management
- **Built-in Help System** - Comprehensive user manual integrated into admin dashboard
- **E2E Encryption** - Optional end-to-end encrypted messaging
- **Consignments** - Built-in consignment tracking and payout management

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Auth**: Supabase Auth with RLS
- **Payments**: Stripe + NOWPayments (crypto)
- **Email**: SendGrid / Postmark
- **Storage**: Supabase Storage
- **Hosting**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Stripe account
- SendGrid or Postmark account

### Installation

```bash
# Clone repository
git clone <your-repo>
cd 709exclusive

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

```bash
# Core
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Multi-tenant
NEXT_PUBLIC_ROOT_DOMAIN=709exclusive.com
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=709exclusive
SUPER_ADMIN_DOMAIN=admin.709exclusive.com

# Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NOWPAYMENTS_API_KEY=your-key (optional)
NOWPAYMENTS_IPN_SECRET=your-secret (optional)

# Email
SENDGRID_API_KEY=SG.xxx (or POSTMARK_API_KEY)

# Privacy & Cron
CRON_SECRET=generate-random-32-byte-string

# Sneaker API (optional - site works without it)
KICKSDB_API_KEY=your-kicks-dev-api-key
```

Generate CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Setup

```bash
# Run all migrations in order
cd sql
for f in *.sql; do psql $DATABASE_URL -f $f; done

# Or run the helper script
./scripts/run-migrations.sh
```

Key migrations:
- `001-030`: Core schema
- `029`: Multi-tenant tables
- `037`: Tenant RLS policies
- `033-036`: Privacy features
- `042`: Sneaker API integration fields

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check
```

Access:
- **Storefront**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Super Admin**: http://localhost:3000/super-admin

### Create First Super Admin

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Assign super_admin role
UPDATE "709_profiles" 
SET role = 'super_admin' 
WHERE id = 'your-user-id';
```

## Project Structure

```
/app
  /admin               → Tenant-scoped admin
  /super-admin         → Platform super admin
  /api                 → API routes
    /admin             → Admin APIs
    /tenants           → Tenant lifecycle
  /account             → Customer account
  /shop                → Public storefront
  /tenants/signup      → Self-serve signup

/components
  /admin               → Admin UI components
  /ui                  → Shared UI components
  FeatureGate.tsx      → Feature flag gating

/lib
  tenant.ts            → Tenant resolution
  tenantAuth.ts        → Tenant-aware auth
  featureGuards.ts     → Feature flag utilities
  themeProvider.ts     → Dynamic theming
  roles.ts             → Role-based access

/sql                   → Database migrations
```

## User Roles

- **super_admin** - Platform-wide access (all tenants)
- **owner** - Full admin access (their tenant)
- **admin** - Full admin access (their tenant)
- **staff** - Limited ops access (inventory, orders, messages)
- **customer** - No admin access

## Tenant Management

### Self-Serve Signup

Users can create tenants at `/tenants/signup`:
1. Create account (Supabase Auth)
2. Create tenant with branding
3. Set custom domain (optional)
4. Start 14-day trial

### Super Admin Management

Super admins can manage all tenants at `/super-admin/tenants`:
- Create tenants
- Update billing/status
- Send owner invites
- Access billing portals
- Suspend/activate tenants

### Tenant Configuration

Each tenant can customize via `settings` JSONB:

```typescript
{
  theme: {
    brand_name: "My Store",
    logo_url: "https://...",
    colors: { /* 18 customizable colors */ }
  },
  features: {
    drops: true,
    wishlist: true,
    messages: true,
    e2e_encryption: true,
    crypto_payments: true,
    local_delivery: true,
    pickup: true,
    consignments: true
  },
  integrations: {
    payments: { provider: "stripe", crypto_provider: "nowpayments" },
    email: { provider: "sendgrid" },
    delivery: { provider: "internal" }
  },
  commerce: { currency: "CAD" }
}
```

## Feature Gating

```tsx
// Component-level
<FeatureGate feature="wishlist">
  <WishlistButton />
</FeatureGate>

// Hook-based
const hasMessages = useFeature('messages')
const { currency } = useCommerce()

// API-level
import { requireFeature } from '@/lib/apiHelpers'
const check = requireFeature(tenant, 'crypto_payments')
if ('error' in check) return check.error
```

## API Routes

### Tenant Management
- `POST /api/tenants/signup` - Self-serve signup
- `GET /api/tenants/billing` - Get billing info
- `POST /api/tenants/billing` - Open billing portal
- `GET /api/tenants/domains` - List domains
- `POST /api/tenants/domains` - Add domain
- `GET /api/tenants/export-all` - Export all data

### Super Admin
- `GET /api/admin/tenants` - List all tenants
- `POST /api/admin/tenants` - Create tenant
- `PATCH /api/admin/tenants/[id]` - Update tenant
- `POST /api/admin/tenants/[id]/invite` - Invite owner

### Admin
- `GET /api/admin/products` - List products
- `GET /api/admin/orders` - List orders
- `GET /api/admin/inventory` - Inventory management
- `GET /api/admin/messages` - Customer messages
- `GET /api/admin/analytics` - Analytics data

### Public
- `GET /api/shop` - Browse products
- `POST /api/checkout` - Create order
- `GET /api/orders` - User's orders

## Testing

```bash
# Audit tenant isolation
npx tsx scripts/audit-tenant-api-coverage.ts

# Run smoke tests
npx tsx scripts/smoke/tenant-creation.mjs
npx tsx scripts/smoke/checkout-reservation.mjs
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

Quick deploy to Vercel:

```bash
# Set environment variables in Vercel dashboard
# Then deploy
vercel --prod
```

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Multi-tenant architecture & privacy features
- Architecture diagrams and RLS policies in [ARCHITECTURE.md](ARCHITECTURE.md)

## License

Proprietary - All rights reserved
