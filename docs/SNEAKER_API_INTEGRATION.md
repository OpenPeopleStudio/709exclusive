# Sneaker API Integration

> **Design Principle**: Third-party sneaker APIs are lenses, not load-bearing beams.

Your site must work if:
- The API rate-limits you
- The images disappear  
- The service vanishes entirely

## Architecture

```
[ Third-Party Sneaker API ]
              ↓ (read-only, fetch)
[ Your Backend Normalizer ]
              ↓ (controlled persistence)
[ Your Storefront (Web/App) ]
```

The sneaker API is never exposed directly to the client.

## Setup

### 1. Get API Key (Optional)

Sign up at [kicks.dev](https://kicks.dev) for a free API key:
- Free tier: 1,000 requests/month
- Paid tiers available for higher volume

### 2. Configure Environment

```bash
# .env.local
KICKSDB_API_KEY=your-api-key-here
```

### 3. Run Migration

```bash
psql $DATABASE_URL -f sql/042_sneaker_api_integration.sql
```

## Usage

### Admin: Search & Import

1. Go to **Admin → Sneaker Search** (`/admin/sneaker-search`)
2. Search for sneakers by name or SKU (e.g., "Jordan 1 Bred" or "555088-001")
3. Preview results - see which already exist in your inventory
4. Click **"Add to Inventory"** to import

### Programmatic Usage

```typescript
import { searchSneakers, importToProduct } from '@/lib/sneakerApi'

// Search
const { results, cached } = await searchSneakers('jordan 1 bred')

// Import to products table
const { productId } = await importToProduct(results[0], tenantId)
```

## What Gets Stored

When you import a sneaker, we store:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Full product name | "Jordan Air Jordan 1 High Chicago" |
| `brand` | Brand name | "Jordan" |
| `colorway` | Color variant | "Black / Varsity Red" |
| `sku` | Industry SKU | "555088-001" |
| `release_date` | Original release | "2022-10-19" |
| `external_image_url` | Third-party image URL | "https://..." |
| `external_id` | API reference ID | "abc123" |
| `data_source` | Where data came from | "kicksdb" |

## Image Handling

### Rules (MVP)

- ❌ Do not download images
- ❌ Do not rehost images  
- ❌ Do not resize or process images
- ✅ Render via `<img src="external_url">`
- ✅ Provide graceful fallback

### Priority

1. Uploaded image (your Supabase Storage)
2. External image URL (third-party API)
3. Placeholder silhouette

### Fallback Behavior

```tsx
<Image
  src={product.primary_image || product.external_image_url}
  onError={() => setHasError(true)}
/>
{hasError && <PlaceholderImage />}
```

## Market Data (Read-Only)

If the API provides resale prices:

```json
{
  "lowest_ask_cents": 42000,
  "highest_bid_cents": 38500,
  "last_sale_cents": 40000,
  "source": "kicksdb",
  "fetched_at": "2026-01-18T..."
}
```

Display as: **"Market reference (informational)"**

Never auto-price listings based on this data.

## Caching

- Search results cached **15 minutes** in memory
- Cache cleared on server restart
- No image caching

## Failure Modes

| Failure | What Happens |
|---------|--------------|
| API down | Search disabled, existing products still render |
| Image broken | Placeholder image shows |
| SKU mismatch | Admin resolves manually |
| API shuts off | New imports paused, site still works |

## API Endpoints

### Search

```http
POST /api/admin/sneaker-api/search
Content-Type: application/json

{
  "query": "jordan 1 bred",
  "limit": 12
}
```

### Import

```http
POST /api/admin/sneaker-api/import
Content-Type: application/json

{
  "sneaker": {
    "brand": "Jordan",
    "model": "Air Jordan 1 High",
    "colorway": "Chicago",
    "sku": "555088-001",
    "externalImageUrl": "https://...",
    "externalId": "abc123",
    "source": "kicksdb"
  }
}
```

### Status

```http
GET /api/admin/sneaker-api/status
```

## Manual Fallback

Site works without the API. For manual product creation:

1. Go to **Admin → Products → New**
2. Enter product details manually
3. Upload images to Supabase Storage

## Legal Posture

You are:
- Displaying externally hosted images
- Not redistributing assets
- Not claiming ownership
- Not scraping directly

This is the lowest-risk posture short of licensed feeds or original photography.

## Future Improvements (Not MVP)

- Migration path to original photography
- Private sneaker database seeded manually
- Bulk import from CSV
- Auto-sync for specific brands

These are scale problems. MVPs die from ambition, not scarcity.
