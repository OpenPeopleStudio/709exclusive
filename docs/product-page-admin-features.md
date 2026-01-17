# Product Page Admin Enhancements

Complete guide to the admin/staff features on the product detail page.

## Overview

The product page now includes powerful admin tools that appear only for authenticated staff, admin, and owner roles. These tools provide real-time insights, quick actions, and workflow shortcuts directly on the customer-facing product page.

## Features

### 1. Admin Quick Actions Bar

**Location:** Top of product info section (right column)

**Roles:** Staff, Admin, Owner

**Actions:**

#### Edit Product (Admin/Owner only)
- Direct link to product edit page
- Quick access to modify product details
- Icon: Pencil/edit icon

#### Manage Stock (Admin/Owner only)
- Jump to inventory management for this product
- Adjust quantities, add variants
- Icon: Plus icon

#### View Orders (All staff roles)
- See all orders containing this product
- Filter orders by product
- Icon: Shopping bag icon

#### Copy Product Link (All staff roles)
- One-click copy of public product URL
- Share with customers or team
- Shows "Copied" confirmation
- Icon: Copy/clipboard icon

### 2. Live Analytics Panel

**Toggle:** "Show/Hide Analytics" button in admin tools header

**Metrics Displayed:**

#### Total Views
- Number of times product page was viewed
- *Note: Requires analytics tracking implementation*

#### Wishlisted
- Count of customers who added to wishlist
- Purple accent color
- Indicates customer interest

#### Stock Alerts
- Number of customers waiting for restock
- Amber accent color
- Shows high demand signal

#### Total Sold
- Historical count of orders with this product
- Green (success) color
- Performance indicator

#### Avg Margin
- Average profit margin percentage
- *Note: Requires cost data implementation*

#### Days Listed
- Days since product was created
- Helps assess inventory age

### 3. Pricing Insights

**Displayed when analytics shown:**

- Average selling price
- Link to detailed price history (admin/owner only)
- Competitive analysis access
- Direct link to reports dashboard

### 4. Customer Intelligence

**Displayed when analytics shown:**

Shows customer interest metrics:

- **Active wishlists:** Current wishlist count
- **Waiting for restock:** Stock alert subscribers
- **Previous orders:** Historical purchase count

**High Demand Alert:**
- Appears when 5+ stock alerts exist
- Amber warning banner
- Suggests restocking opportunity

## Implementation Details

### Component Architecture

```
app/product/[slug]/page.tsx
├── ProductAdminTools (conditionally rendered)
└── API: /api/admin/products/stats
```

### Files Created

1. **`components/admin/ProductAdminTools.tsx`**
   - Main admin tools component
   - Handles UI, state, clipboard operations
   - Responsive grid layout

2. **`app/api/admin/products/stats/route.ts`**
   - Fetches product statistics
   - Verifies user role (staff/admin/owner)
   - Aggregates data from multiple tables

### Database Queries

Stats API fetches from:
- `wishlist_items` - wishlist count
- `stock_alerts` - restock notifications
- `order_items` - historical orders
- `products` + `product_variants` - pricing & age

### Security

- **Role-based access control:** Only staff/admin/owner can view tools
- **Server-side verification:** Stats API validates user role
- **Tenant isolation:** All queries scoped to user's tenant
- **No sensitive data exposure:** Customer PII not revealed

## Usage

### For Staff

1. Navigate to any product page while logged in with staff/admin/owner role
2. Admin Tools panel appears at top of product info
3. Click "Show Analytics" to reveal performance metrics
4. Use quick action buttons for common tasks

### Quick Actions

**Edit Product:**
```
/admin/products?edit={productId}
```

**Manage Stock:**
```
/admin/inventory?product={productId}
```

**View Orders:**
```
/admin/orders?product={productId}
```

**Copy Link:**
- Copies: `https://yourdomain.com/product/{slug}`
- Shows 2-second "Copied" confirmation

### Analytics Interpretation

**High wishlist count (>10):**
- Strong customer interest
- Consider featuring product
- Monitor stock levels

**High stock alerts (>5):**
- Customers waiting for restock
- Priority for reordering
- Potential lost sales

**Low days in stock (<7):**
- Fast-moving inventory
- Strong demand signal
- Consider pricing strategy

**High days in stock (>30):**
- Slow-moving inventory
- Consider promotion
- Review pricing vs. market

## Customization

### Adding New Metrics

To add metrics to `ProductStats`:

```typescript
// types/database.ts or inline
interface ProductStats {
  views?: number
  wishlistCount?: number
  stockAlerts?: number
  totalOrders?: number
  avgPrice?: number
  profitMargin?: number
  daysInStock?: number
  // Add new metric:
  newMetric?: number
}
```

Then update:
1. Stats API route to fetch data
2. ProductAdminTools component to display

### Styling

All styling uses CSS variables:
- `--accent` - Primary actions
- `--accent-amber` - Warnings/alerts
- `--success` - Positive metrics
- `--bg-tertiary` - Button backgrounds
- `--border-primary` - Borders

### Responsive Behavior

- **Desktop:** Tools appear in sticky right column
- **Mobile:** Tools appear above product info
- **Analytics panel:** Collapses on small screens
- **Grid:** 2 columns mobile, 4 columns desktop

## API Reference

### GET `/api/admin/products/stats`

**Query Parameters:**
- `productId` (required): UUID of product

**Response:**
```json
{
  "stats": {
    "wishlistCount": 12,
    "stockAlerts": 5,
    "totalOrders": 23,
    "daysInStock": 14,
    "avgPrice": 15000
  }
}
```

**Errors:**
- 400: Missing productId
- 401: Not authenticated
- 403: Insufficient permissions (not staff/admin/owner)
- 500: Server error

## Future Enhancements

### Planned Features

1. **Real-time Views Tracking**
   - Add analytics system
   - Track page views per product
   - Show trending products

2. **Profit Margin Calculation**
   - Add cost tracking to variants
   - Calculate margin automatically
   - Show profitability insights

3. **Conversion Rate**
   - Track view-to-purchase ratio
   - Compare against catalog average
   - Identify high/low performers

4. **Competitor Price Alerts**
   - Monitor external marketplaces
   - Alert when underpriced
   - Suggest pricing adjustments

5. **Quick Edit Modal**
   - Inline editing without navigation
   - Update price, stock, description
   - Save without leaving page

6. **Bulk Actions**
   - Select multiple variants
   - Adjust prices in bulk
   - Update conditions

7. **Performance Badges**
   - "Top Seller" badge
   - "Fast Mover" indicator
   - "High Margin" tag

## Best Practices

### For Admins

1. **Monitor stock alerts:** High alerts = restock priority
2. **Check days in stock:** >30 days = review pricing
3. **Use quick links:** Faster than navigating admin menu
4. **Review analytics daily:** Spot trends early
5. **Copy links for support:** Quick customer service

### For Staff

1. **Use order link:** Fastest way to check product orders
2. **Copy link for sharing:** Share products in team chat
3. **Check stock alerts:** Know what customers want
4. **Monitor wishlists:** Gauge product popularity

### Performance

- Analytics load asynchronously (no page delay)
- Stats cached for 5 minutes (reduce DB load)
- Toggle analytics to hide/show as needed
- Minimal impact on customer experience

## Troubleshooting

### Admin Tools Not Showing

**Check:**
1. User is logged in
2. User has staff/admin/owner role
3. User belongs to product's tenant
4. Browser cache cleared

### Stats Not Loading

**Check:**
1. Network tab for API errors
2. User permissions in database
3. Product exists in tenant
4. Console for error messages

### Actions Not Working

**Check:**
1. Query parameters in URL
2. Admin pages exist and accessible
3. User has permissions for target page
4. Links follow expected format

## Accessibility

- Keyboard navigation supported
- ARIA labels on all buttons
- Focus states visible
- Color contrast meets WCAG AA
- Screen reader compatible
- Tooltips for icon-only buttons

## Mobile Experience

- Touch-friendly button sizing (44px minimum)
- Collapsible analytics panel
- Horizontal scroll for metrics
- Bottom sheet on small screens
- Native share on mobile (copy link)

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** Production Ready
