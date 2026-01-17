export type TenantFeatureFlags = {
  drops?: boolean
  wishlist?: boolean
  messages?: boolean
  e2e_encryption?: boolean
  crypto_payments?: boolean
  local_delivery?: boolean
  pickup?: boolean
  admin?: boolean
  consignments?: boolean
}

export type TenantThemeColors = {
  bg_primary?: string
  bg_secondary?: string
  bg_tertiary?: string
  bg_elevated?: string
  text_primary?: string
  text_secondary?: string
  text_muted?: string
  accent?: string
  accent_hover?: string
  accent_muted?: string
  accent_blue?: string
  accent_blue_hover?: string
  accent_amber?: string
  accent_amber_hover?: string
  border_primary?: string
  border_secondary?: string
  success?: string
  warning?: string
  error?: string
}

export type TenantTheme = {
  brand_name?: string
  logo_url?: string | null
  colors?: TenantThemeColors
}

export type TenantHeroContent = {
  eyebrow?: string
  headline?: string
  subhead?: string
  primary_cta?: { label: string; href: string }
  secondary_cta?: { label: string; href: string }
}

export type TenantFeatureCard = {
  title: string
  description: string
  icon?: string
}

export type TenantContent = {
  hero?: TenantHeroContent
  features?: TenantFeatureCard[]
}

export type TenantIntegrations = {
  payments?: {
    provider?: 'stripe' | 'manual'
    crypto_provider?: 'nowpayments' | 'disabled'
  }
  email?: {
    provider?: 'sendgrid' | 'postmark' | 'disabled'
  }
  delivery?: {
    provider?: 'internal' | 'manual'
  }
}

export type TenantCommerce = {
  currency?: string
}

export type TenantSettings = {
  theme?: TenantTheme
  content?: TenantContent
  features?: TenantFeatureFlags
  integrations?: TenantIntegrations
  commerce?: TenantCommerce
}

export type TenantContextValue = {
  id: string
  slug: string
  name: string
  primary_domain?: string | null
  settings: TenantSettings
  status: 'active' | 'inactive' | 'suspended'
}
