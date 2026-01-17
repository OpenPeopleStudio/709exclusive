# Platform Architecture

## Overview

709exclusive is a multi-tenant SaaS e-commerce platform with complete tenant isolation, privacy-first features, and customizable theming.

## Multi-Tenant Architecture

### Tenant Resolution

**Flow**: `Request → Domain/Subdomain → Tenant Context → RLS Filtering`

1. **Domain Routing** (`lib/tenant.ts`)
   - Custom domains: `store.example.com` → tenant lookup via `tenant_domains` table
   - Subdomains: `store.709exclusive.com` → slug-based lookup
   - Localhost: `store.localhost:3000` → dev mode subdomain
   - Fallback: Unmatched requests → default tenant

2. **Resolution Priority**
   - Verified custom domain (highest)
   - Primary domain
   - Subdomain slug
   - Default tenant (fallback)

3. **Caching**
   - Tenant lookups cached with React `cache()`
   - Domain verification status cached
   - Consider Redis for production

### Database Schema

**Core Multi-Tenant Tables**:

```sql
tenants (
  id uuid primary key,
  slug text unique,
  name text,
  status text check (status in ('active', 'inactive', 'suspended')),
  primary_domain text,
  settings jsonb,  -- theme, features, integrations
  created_at, updated_at
)

tenant_domains (
  id uuid primary key,
  tenant_id uuid references tenants,
  domain text unique,
  is_primary boolean,
  verified_at timestamp,  -- DNS verification
  created_at
)

tenant_billing (
  tenant_id uuid primary key references tenants,
  plan text,
  status text check (status in ('trialing', 'active', 'past_due', 'canceled')),
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamp,
  created_at, updated_at
)
```

**Tenant-Scoped Tables** (all have `tenant_id` column):
- `709_profiles`, `products`, `product_variants`, `product_images`
- `orders`, `order_items`, `messages`
- `consignors`, `consignment_items`, `consignment_payouts`
- `wishlist_items`, `stock_alerts`, `activity_logs`
- And 15+ more tables

**Indexes**:
- `tenant_id` indexed on all tenant-scoped tables
- Composite unique: `(tenant_id, slug)` for products/models
- Composite unique: `(tenant_id, email)` for consignors

### Row-Level Security (RLS)

**Helper Functions** (`sql/037_tenant_rls_policies.sql`):

```sql
-- Get current user's tenant
auth.current_user_tenant_id() returns uuid

-- Check if user is super admin
auth.is_super_admin() returns boolean

-- Check if user is tenant admin
auth.is_tenant_admin() returns boolean
```

**Policy Pattern**:

```sql
-- Example: Products table
create policy "View tenant products"
on products for select
using (
  auth.is_super_admin() or
  tenant_id = auth.current_user_tenant_id()
);

create policy "Admins manage products"
on products for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);
```

**RLS Coverage**: 25+ tables with comprehensive policies

### Authentication & Authorization

**Role Hierarchy**:

```
super_admin     → Platform-wide access (all tenants)
  ↓
owner/admin     → Full admin access (their tenant)
  ↓
staff           → Ops access: inventory, orders, messages
  ↓
customer        → Own data only
```

**Auth Context** (`lib/tenantAuth.ts`):

```typescript
interface TenantAuthContext {
  user: { id: string; email?: string } | null
  profile: Profile | null
  tenant: TenantContextValue | null
  isSuperAdmin: boolean
}

// Usage in API routes
const auth = await requireTenantAdmin(request)
// Now: auth.user, auth.profile, auth.tenant available
```

**Auth Helpers**:
- `getTenantAuth()` - Get auth context (nullable)
- `requireTenantAuth()` - Require authenticated user
- `requireSuperAdmin()` - Require super admin (validates role + domain)
- `requireTenantAdmin()` - Require tenant admin (validates role + tenant)

### Super Admin Workspace

**Routes**:
- `/super-admin/tenants` - Manage all tenants
- `/super-admin/billing` - Platform billing overview
- `/super-admin/analytics` - Cross-tenant analytics
- `/super-admin/support` - Support console
- `/super-admin/settings` - Platform configuration

**Access Control**:
- Requires `super_admin` role
- Optionally validates `SUPER_ADMIN_DOMAIN` in production
- Separate layout and navigation from tenant admin

**Capabilities**:
- Create/update/suspend tenants
- View all tenant data
- Manage billing subscriptions
- Send owner invites
- Export tenant data

### Tenant Admin Workspace

**Routes**: `/admin/*`
- Scoped to user's tenant only
- Feature flags control available sections
- Separate from super admin workspace

**Sections**:
- Products, Models, Inventory
- Orders, Returns, Fulfillment
- Customers, Messages
- Staff Location Tracking
- Reports & Analytics
- Tenant Settings

### Tenant Lifecycle

**1. Signup Flow** (`/tenants/signup`):
```
User Registration → Tenant Creation → Billing Setup → Owner Assignment
```

**2. Trial Period**:
- 14 days by default
- No credit card required
- Full feature access
- Status: `trialing`

**3. Subscription**:
- Stripe integration
- Plans: starter, professional, enterprise (configurable)
- Status transitions: `trialing` → `active` → `past_due` → `canceled`

**4. Suspension/Reactivation**:
- Status check on every request
- Suspended tenants: read-only mode
- Super admin can reactivate

**5. Data Export** (`/api/tenants/export-all`):
- Owner-only access
- Complete tenant backup
- JSON format with metadata
- Includes: products, orders, customers, messages, etc.

### Customization

**Theme Settings**:

```typescript
theme: {
  brand_name: "Store Name",
  logo_url: "https://cdn.example.com/logo.png",
  colors: {
    bg_primary: "#0B0B0C",
    text_primary: "#F8F8F8",
    accent: "#E10600",
    // ... 15 more colors
  }
}
```

**CSS Variables** (`lib/themeProvider.ts`):
- Injected as `:root { --bg-primary: #0B0B0C; }` 
- Server-side via `lib/theme.ts`
- Client-side via `components/TenantThemeProvider.tsx`

**Feature Flags**:

```typescript
features: {
  drops: boolean           // Product drops/releases
  wishlist: boolean        // Wishlist functionality
  messages: boolean        // Customer messaging
  e2e_encryption: boolean  // E2E encrypted messages
  crypto_payments: boolean // Crypto checkout
  local_delivery: boolean  // Local delivery options
  pickup: boolean          // In-store pickup
  consignments: boolean    // Consignment tracking
}
```

**Integration Settings**:

```typescript
integrations: {
  payments: {
    provider: "stripe" | "manual",
    crypto_provider: "nowpayments" | "disabled"
  },
  email: {
    provider: "sendgrid" | "postmark" | "disabled"
  },
  delivery: {
    provider: "internal" | "manual"
  }
}
```

### Feature Gating

**Component Level**:

```tsx
import { FeatureGate } from '@/components/FeatureGate'

<FeatureGate feature="wishlist">
  <WishlistButton />
</FeatureGate>
```

**Hook Level**:

```tsx
import { useFeature } from '@/components/FeatureGate'

const hasMessages = useFeature('messages')
const hasWishlist = useFeature('wishlist')
```

**API Level**:

```typescript
import { requireFeature } from '@/lib/apiHelpers'

const check = requireFeature(tenant, 'crypto_payments')
if ('error' in check) return check.error
```

## Privacy Features

### Compliance

Supports GDPR, CCPA, and PIPEDA requirements:
- Data export (portability)
- Account deletion (right to be forgotten)
- Consent management
- Data minimization
- Purpose limitation
- Retention policies

### Privacy Dashboard

**Route**: `/account/privacy`

**Features**:
- View all stored personal data
- Account statistics
- Manage consents
- Export data (JSON)
- Request account deletion

### Data Export

**Endpoint**: `GET /api/account/export-data`

**Exported Data**:
- Profile information
- Order history (complete)
- Messages (encrypted if E2E enabled)
- Wishlist items
- Recently viewed products
- Staff location data (if applicable)
- Consignment data (if consignor)

**Format**: JSON with metadata
- Includes export timestamp
- User-friendly structure
- Encrypted data preserved

### Account Deletion

**Endpoint**: `DELETE /api/account/delete-account`

**Process**:
1. User requests deletion
2. Confirmation email sent
3. 30-day grace period
4. Soft delete → anonymization → hard delete
5. Retains: order IDs, transaction records (legal requirement)
6. Deletes: PII, messages, location data

**Anonymization**:
```typescript
{
  email: "deleted_user_[hash]@deleted.local",
  full_name: null,
  phone: null,
  // Order history preserved but anonymized
}
```

### Consent Management

**Types**:
- Marketing emails
- Analytics tracking
- Data sharing (optional features)
- Location tracking (staff only)

**Storage**: `user_preferences.consents` JSONB
**UI**: Privacy dashboard with toggle controls

### E2E Encrypted Messages

**Optional Feature** (tenant flag: `e2e_encryption`)

**Flow**:
1. Customer generates key pair (WebCrypto API)
2. Public key stored in profile
3. Messages encrypted client-side before send
4. Stored encrypted in database
5. Decrypted client-side on read

**Implementation**:
- `lib/crypto/e2e.ts` - Encryption utilities
- `lib/crypto/indexedDB.ts` - Key storage
- `hooks/useE2EEncryption.ts` - React hook
- `components/EncryptionSettings.tsx` - UI

**Key Management**:
- Keys stored in IndexedDB
- Backup to encrypted file
- Recovery via backup file upload
- Lost keys = lost messages (by design)

### Data Retention

**Automated Cleanup** (`sql/037_automated_retention.sql`):

**Policies**:
- Guest messages: 90 days
- Inactive wishlists: 2 years
- Viewed products: 90 days
- Staff locations: 90 days (if opted out)
- Activity logs: 1 year

**Cron Job**: `GET /api/cron/data-retention/cleanup`
- Requires `CRON_SECRET` header
- Runs daily (recommended: 2 AM UTC)
- Logs deletions to activity log

**Vercel Cron** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/data-retention/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

### Privacy Controls

**Staff Location Tracking**:
- Opt-in required
- Can disable anytime
- Auto-cleanup after 90 days (if opted out)
- Export available
- `/staff/location/export` for bulk export

**Message Privacy**:
- Can purge message history
- Retention settings per user
- Admin can set tenant-wide retention
- E2E encryption optional

**Consignor Privacy**:
- Separate authentication (magic link)
- Limited data access
- Can export own data
- Cannot see other consignors

## Security

### Tenant Isolation

**Guarantees**:
1. All queries filtered by `tenant_id`
2. RLS policies enforce at database level
3. Super admins explicitly bypass with checks
4. Cross-tenant access logged

**Validation**:
```bash
# Audit tenant isolation
npx tsx scripts/audit-tenant-api-coverage.ts
```

**Tests**:
- Create multiple test tenants
- Verify no data leakage
- Check RLS with different roles
- Test subdomain/domain routing

### Domain Verification

**Process**:
1. Tenant adds custom domain
2. DNS TXT record required
3. Verification API called
4. `verified_at` timestamp set
5. Domain active only after verification

**Prevents**:
- Domain hijacking
- Unauthorized domain claims
- DNS spoofing attacks

### API Security

**Rate Limiting**: (Vercel automatic)
**CORS**: Configured per tenant domain
**CSRF**: Next.js automatic
**XSS Prevention**: React escaping + CSP headers
**SQL Injection**: Parameterized queries only

### Audit Logging

**All Actions Logged**:
```typescript
activity_logs {
  tenant_id: uuid,
  user_id: uuid,
  action: string,           // 'product_created', 'order_fulfilled', etc.
  entity_type: string,      // 'product', 'order', etc.
  entity_id: uuid,
  details: jsonb,           // Action-specific metadata
  created_at: timestamp
}
```

**Logged Events**:
- Tenant creation/updates
- User role changes
- Data exports
- Account deletions
- Cross-tenant access attempts
- Billing changes
- Domain verification

## Performance

### Caching Strategy

**Tenant Data**:
- React `cache()` for SSR
- Consider Redis for production
- Cache invalidation on settings update

**Product Catalog**:
- Static generation where possible
- ISR (Incremental Static Regeneration)
- CDN caching for images

**Database**:
- Connection pooling (Supabase)
- Prepared statements
- Indexed queries
- Read replicas for analytics

### Optimization

**Indexes**:
- All `tenant_id` columns indexed
- Composite indexes for common queries
- Covering indexes for analytics

**Queries**:
- Always include `tenant_id` in WHERE
- Avoid N+1 queries
- Use EXPLAIN ANALYZE for slow queries
- Consider materialized views for reports

**Assets**:
- Next.js Image optimization
- CDN for static files
- Lazy loading for images
- Code splitting per route

## Monitoring

**Recommended Tools**:
- Vercel Analytics (automatic)
- Sentry for errors
- LogDrain for logs
- Supabase metrics

**Key Metrics**:
- Tenant creation rate
- Active tenant count
- RLS policy performance
- API response times
- Database query times
- Error rates per tenant

**Alerts**:
- Cross-tenant access attempts
- RLS policy violations
- Failed logins (brute force)
- High error rates
- Slow queries
- Disk usage

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Environment Variables Required**:
- Supabase: URL, anon key, service role key
- Stripe: secret key, publishable key, webhook secret
- Email: SendGrid or Postmark API key
- Multi-tenant: ROOT_DOMAIN, SUPER_ADMIN_DOMAIN
- Cron: CRON_SECRET

**Migration Order**:
1. Run all SQL migrations in order (001-037)
2. Verify RLS policies active
3. Create default tenant
4. Create super admin user
5. Deploy application
6. Set up cron jobs
7. Configure custom domains (if needed)

## Troubleshooting

**Tenant not resolving**:
- Check domain DNS settings
- Verify `tenant_domains` entry
- Check `verified_at` timestamp
- Inspect resolution logs

**RLS blocking queries**:
- Verify user has correct role
- Check tenant_id matches
- Review RLS policies
- Check super admin bypass

**Messages not delivering**:
- Verify RLS policies include tenant_id
- Check sender/recipient tenant match
- Review message policies

**Build failures**:
- Run `npm run build` locally
- Check TypeScript errors
- Verify environment variables
- Review import paths

**Performance issues**:
- Check database indexes
- Review slow query logs
- Verify caching strategy
- Check N+1 queries
- Monitor tenant count

## Testing

**Unit Tests**:
```bash
npm run test
```

**Tenant Isolation**:
```bash
npx tsx scripts/audit-tenant-isolation.ts
```

**API Coverage**:
```bash
npx tsx scripts/audit-tenant-api-coverage.ts
```

**Smoke Tests**:
```bash
npx tsx scripts/smoke/tenant-creation.mjs
npx tsx scripts/smoke/checkout-reservation.mjs
```

**Manual Testing Checklist**:
- [ ] Create tenant via signup
- [ ] Customize theme/branding
- [ ] Add custom domain
- [ ] Toggle feature flags
- [ ] Create products/orders
- [ ] Send messages
- [ ] Export user data
- [ ] Delete account
- [ ] Test RLS with different roles
- [ ] Verify tenant isolation
