# Hero Section Customization

Complete documentation for customizing the homepage hero section.

## Overview

Tenants can customize their homepage hero section including:
- Eyebrow text (small text above headline)
- Main headline
- Subheadline
- Primary and secondary CTA buttons

## Features

### Customization Options

1. **Eyebrow Text**
   - Small text above the main headline
   - Default: Brand name
   - Use case: Tagline, category, or brand identifier

2. **Headline**
   - Main hero text (large, bold)
   - Default: "Authentic sneakers with local delivery"
   - Supports plain text or React components

3. **Subheadline**
   - Supporting descriptive text
   - Default: "A modern resale marketplace built for Newfoundland..."
   - Use case: Value proposition, key features

4. **Primary CTA Button**
   - Main call-to-action
   - Configurable label and URL
   - Default: "Browse inventory" → "/shop"
   - Style: Primary button (accent color)

5. **Secondary CTA Button**
   - Secondary call-to-action
   - Configurable label and URL
   - Default: "New arrivals" → "/shop?sort=newest"
   - Style: Ghost/outline button

## Implementation

### Admin UI

Location: `/admin/tenant-settings`

The Hero Section form includes:
- Text input for eyebrow
- Text input for headline
- Textarea for subheadline
- Two sets of inputs for CTAs (label + URL each)

```tsx
// State management
const [heroEyebrow, setHeroEyebrow] = useState('')
const [heroHeadline, setHeroHeadline] = useState('')
const [heroSubhead, setHeroSubhead] = useState('')
const [heroPrimaryCTA, setHeroPrimaryCTA] = useState({ label: '', href: '' })
const [heroSecondaryCTA, setHeroSecondaryCTA] = useState({ label: '', href: '' })
```

### Data Structure

TypeScript types (`types/tenant.ts`):

```typescript
export type TenantHeroContent = {
  eyebrow?: string
  headline?: string
  subhead?: string
  primary_cta?: { label: string; href: string }
  secondary_cta?: { label: string; href: string }
}

export type TenantContent = {
  hero?: TenantHeroContent
  features?: TenantFeatureCard[]
}

export type TenantSettings = {
  theme?: TenantTheme
  content?: TenantContent
  features?: TenantFeatureFlags
  integrations?: TenantIntegrations
  commerce?: TenantCommerce
}
```

### Database Storage

Hero content is stored in the `tenants` table:

```sql
settings: {
  content: {
    hero: {
      eyebrow: "709exclusive",
      headline: "Premium streetwear delivered locally",
      subhead: "Shop authentic sneakers and apparel...",
      primary_cta: { label: "Shop now", href: "/shop" },
      secondary_cta: { label: "Latest drops", href: "/drops" }
    }
  }
}
```

### Frontend Rendering

Location: `app/page.tsx`

```tsx
const { settings } = useTenant()
const hero = settings?.content?.hero
const brandName = settings?.theme?.brand_name || 'Shop'

// Rendering with fallbacks
<p className="text-xs uppercase...">
  {hero?.eyebrow || brandName}
</p>

<h1 className="text-5xl...">
  {hero?.headline || (
    <>Authentic sneakers <span className="text-gradient">with local delivery</span></>
  )}
</h1>

<p className="text-lg...">
  {hero?.subhead || "A modern resale marketplace..."}
</p>

<Button href={hero?.primary_cta?.href || "/shop"} variant="primary">
  {hero?.primary_cta?.label || "Browse inventory"}
</Button>

<Button href={hero?.secondary_cta?.href || "/shop?sort=newest"} variant="secondary">
  {hero?.secondary_cta?.label || "New arrivals"}
</Button>
```

## API Integration

### Save Endpoint

`PATCH /api/admin/tenant-settings`

Request body:
```json
{
  "settings": {
    "content": {
      "hero": {
        "eyebrow": "Optional eyebrow text",
        "headline": "Optional main headline",
        "subhead": "Optional supporting text",
        "primary_cta": {
          "label": "Button text",
          "href": "/shop"
        },
        "secondary_cta": {
          "label": "Button text",
          "href": "/drops"
        }
      }
    }
  }
}
```

**Smart Defaults**: If all hero fields are empty, the `hero` object is not saved (set to `undefined`), allowing defaults to show.

### Load Endpoint

`GET /api/admin/tenant-settings`

Response includes the tenant's full settings object with hero content.

## Best Practices

### Content Guidelines

1. **Eyebrow Text**
   - Keep it short (1-3 words)
   - Use ALL CAPS for impact
   - Examples: "709EXCLUSIVE", "PREMIUM STREETWEAR"

2. **Headline**
   - Clear value proposition
   - 5-10 words max
   - Focus on benefit, not feature
   - Examples:
     - "Authentic sneakers with local delivery"
     - "Premium streetwear for Newfoundland"
     - "Verified resale, delivered tomorrow"

3. **Subheadline**
   - Expand on headline
   - 15-30 words
   - Include key differentiators
   - Examples:
     - "A modern resale marketplace built for Newfoundland. Shop verified inventory, pay with card or crypto, and track every order in one place."

4. **CTA Buttons**
   - Use action verbs
   - Keep labels short (2-3 words)
   - Primary CTA: main conversion goal
   - Secondary CTA: alternative path
   - Examples:
     - Primary: "Shop now", "Browse inventory", "Start shopping"
     - Secondary: "New arrivals", "Latest drops", "View all"

### URL Guidelines

- Use relative paths (e.g., `/shop`, `/drops`)
- Leverage query parameters for filtering (e.g., `/shop?sort=newest`)
- Common patterns:
  - `/shop` - Main catalog
  - `/drops` - Time-limited items
  - `/shop?sort=newest` - Latest arrivals
  - `/shop?category=sneakers` - Category filter

## Testing

1. **Empty State**: Leave all fields blank → should show defaults
2. **Partial Customization**: Set only headline → should show custom headline + default others
3. **Full Customization**: Set all fields → should show all custom content
4. **Link Validation**: Click both CTA buttons → should navigate correctly
5. **Mobile Responsiveness**: Test on mobile → text should scale, buttons stack vertically

## Accessibility

- Semantic HTML used (`<h1>`, `<p>`, `<a>`)
- Proper heading hierarchy
- Link text is descriptive (not just "Click here")
- Color contrast meets WCAG AA standards
- Buttons have clear focus states

## Future Enhancements

Potential additions:
- Background image/video upload
- Text alignment options (left, center, right)
- Multiple CTA button styles
- A/B testing variants
- Animation/transition effects
- Hero layout templates (full-width, split, centered)
