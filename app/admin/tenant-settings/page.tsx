'use client'

import { useEffect, useMemo, useState } from 'react'
import type { TenantFeatureFlags, TenantIntegrations, TenantSettings } from '@/types/tenant'

type TenantRecord = {
  id: string
  name: string
  slug: string
  status: string
  primary_domain: string | null
  settings: TenantSettings
}

type TenantDomain = {
  id: string
  domain: string
  is_primary: boolean
  verified_at: string | null
  created_at: string
}

type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

type BillingInfo = {
  tier: SubscriptionTier
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  current_period_end?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

const featuresByTier = {
  starter: ['products', 'orders', 'customers', 'inventory', 'messages'],
  professional: ['drops', 'wishlist', 'messages', 'e2e_encryption', 'pickup', 'local_delivery', 'admin'],
  enterprise: ['drops', 'wishlist', 'messages', 'e2e_encryption', 'crypto_payments', 'local_delivery', 'pickup', 'admin', 'consignments'],
}

const featureOptions: Array<{ key: keyof TenantFeatureFlags; label: string; description: string }> = [
  { key: 'drops', label: 'Product Drops', description: 'Scheduled product releases with countdown timers' },
  { key: 'wishlist', label: 'Wishlists & Alerts', description: 'Let customers save items and get notified' },
  { key: 'messages', label: 'Customer Messages', description: 'Direct messaging between staff and customers' },
  { key: 'e2e_encryption', label: 'E2E Encryption', description: 'End-to-end encrypted messaging for privacy' },
  { key: 'crypto_payments', label: 'Crypto Payments', description: 'Accept cryptocurrency payments' },
  { key: 'local_delivery', label: 'Local Delivery', description: 'Enable local delivery options' },
  { key: 'pickup', label: 'Store Pickup', description: 'In-store pickup for online orders' },
  { key: 'admin', label: 'Advanced Admin', description: 'Extended admin analytics and tools' },
  { key: 'consignments', label: 'Consignment Management', description: 'Track and manage consigned inventory' },
]

type CryptoProvider = TenantIntegrations['payments'] extends { crypto_provider?: infer T } ? T : never

// Plan pricing and features
const PLAN_DETAILS: Record<SubscriptionTier, {
  name: string
  price: number
  description: string
  features: string[]
  color: string
}> = {
  starter: {
    name: 'Starter',
    price: 99,
    description: 'Perfect for getting started',
    features: ['Up to 100 products', 'Essential inventory tools', 'Customer messaging', 'Secure payments'],
    color: 'var(--accent)',
  },
  professional: {
    name: 'Professional',
    price: 199,
    description: 'Built for growth',
    features: ['Unlimited products', 'Product drops & alerts', 'End-to-end encryption', 'Local delivery & pickup', 'Advanced analytics'],
    color: 'var(--accent)',
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    description: 'Maximum performance',
    features: ['All Professional features', 'Cryptocurrency payments', 'Consignment management', 'Priority support', 'Custom integrations'],
    color: '#a855f7',
  },
}

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'customization' | 'features' | 'integrations' | 'subscription'>('general')
  const [tenant, setTenant] = useState<TenantRecord | null>(null)
  const [domains, setDomains] = useState<TenantDomain[]>([])
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [heroEyebrow, setHeroEyebrow] = useState('')
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubhead, setHeroSubhead] = useState('')
  const [heroPrimaryCTA, setHeroPrimaryCTA] = useState({ label: '', href: '' })
  const [heroSecondaryCTA, setHeroSecondaryCTA] = useState({ label: '', href: '' })
  const [colors, setColors] = useState<Record<string, string>>({})
  const [typography, setTypography] = useState<Record<string, any>>({})
  const [features, setFeatures] = useState<TenantFeatureFlags>({})
  const [integrations, setIntegrations] = useState<TenantIntegrations>({})
  const [domainInput, setDomainInput] = useState('')
  const [makePrimary, setMakePrimary] = useState(true)
  const [addingDomain, setAddingDomain] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Subscription modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment' | 'processing' | 'success'>('select')
  const [mockCardNumber, setMockCardNumber] = useState('')
  const [mockCardExpiry, setMockCardExpiry] = useState('')
  const [mockCardCvc, setMockCardCvc] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  const primaryDomain = useMemo(() => {
    return domains.find((d) => d.is_primary)?.domain || tenant?.primary_domain || ''
  }, [domains, tenant?.primary_domain])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tenantRes, domainsRes] = await Promise.all([
          fetch('/api/admin/tenant-settings'),
          fetch('/api/tenants/domains'),
        ])

        if (tenantRes.ok) {
          const data = await tenantRes.json()
          setTenant(data.tenant)
          setBrandName(data.tenant?.settings?.theme?.brand_name || data.tenant?.name || '')
          setLogoUrl(data.tenant?.settings?.theme?.logo_url || '')
          setHeroEyebrow(data.tenant?.settings?.content?.hero?.eyebrow || '')
          setHeroHeadline(data.tenant?.settings?.content?.hero?.headline || '')
          setHeroSubhead(data.tenant?.settings?.content?.hero?.subhead || '')
          setHeroPrimaryCTA(data.tenant?.settings?.content?.hero?.primary_cta || { label: '', href: '' })
          setHeroSecondaryCTA(data.tenant?.settings?.content?.hero?.secondary_cta || { label: '', href: '' })
          setColors(data.tenant?.settings?.theme?.colors || {})
          setTypography(data.tenant?.settings?.theme?.typography || {})
          setFeatures(data.tenant?.settings?.features || {})
          setIntegrations(data.tenant?.settings?.integrations || {})
          
          // Mock billing data (replace with actual API call)
          setBilling({
            tier: 'enterprise',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        } else {
          const payload = await tenantRes.json().catch(() => ({}))
          setError(payload.error || 'Failed to load tenant settings')
        }

        if (domainsRes.ok) {
          const data = await domainsRes.json()
          setDomains(data.domains || [])
        }
      } catch (e) {
        console.error('Tenant settings load error:', e)
        setError('Failed to load tenant settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Mock subscription change handlers
  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === billing?.tier) return
    setSelectedPlan(tier)
    setCheckoutStep('payment')
    setShowCheckoutModal(true)
    // Reset form
    setMockCardNumber('')
    setMockCardExpiry('')
    setMockCardCvc('')
  }

  const handleMockPayment = async () => {
    if (!selectedPlan) return
    
    setProcessingPayment(true)
    setCheckoutStep('processing')
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate success
    setCheckoutStep('success')
    
    // Update billing after a short delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setBilling({
      tier: selectedPlan,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    
    setProcessingPayment(false)
    
    // Close modal after showing success
    setTimeout(() => {
      setShowCheckoutModal(false)
      setSelectedPlan(null)
      setCheckoutStep('select')
    }, 1000)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const isPaymentFormValid = mockCardNumber.replace(/\s/g, '').length >= 15 && 
    mockCardExpiry.length >= 5 && 
    mockCardCvc.length >= 3

  const toggleFeature = (key: keyof TenantFeatureFlags) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev?.[key] }))
  }

  const updateIntegration = (section: keyof TenantIntegrations, value: string) => {
    setIntegrations((prev) => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        ...(section === 'payments' ? { provider: value } : {}),
        ...(section === 'email' ? { provider: value } : {}),
        ...(section === 'delivery' ? { provider: value } : {}),
      },
    }))
  }

  const updateColor = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const updateTypography = (section: string, key: string, value: string) => {
    setTypography((prev) => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [key]: value,
      },
    }))
  }

  const updateCryptoProvider = (value: CryptoProvider) => {
    setIntegrations((prev) => ({
      ...prev,
      payments: {
        ...prev?.payments,
        crypto_provider: value,
      },
    }))
  }

  const saveSettings = async () => {
    if (!tenant) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenant.name,
          settings: {
            theme: { 
              brand_name: brandName,
              logo_url: logoUrl || null,
              colors: Object.keys(colors).length > 0 ? colors : undefined,
              typography: Object.keys(typography).length > 0 ? typography : undefined,
            },
            content: {
              hero: heroEyebrow || heroHeadline || heroSubhead || heroPrimaryCTA.label || heroSecondaryCTA.label
                ? {
                    eyebrow: heroEyebrow || undefined,
                    headline: heroHeadline || undefined,
                    subhead: heroSubhead || undefined,
                    primary_cta: heroPrimaryCTA.label ? heroPrimaryCTA : undefined,
                    secondary_cta: heroSecondaryCTA.label ? heroSecondaryCTA : undefined,
                  }
                : undefined,
            },
            features,
            integrations,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to save settings')
        return
      }
      setTenant(data.tenant)
    } catch (e) {
      console.error('Tenant settings save error:', e)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addDomain = async () => {
    if (!domainInput.trim()) return
    setAddingDomain(true)
    setError(null)
    try {
      const res = await fetch('/api/tenants/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainInput.trim(),
          makePrimary,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to add domain')
        return
      }
      setDomainInput('')
      const listRes = await fetch('/api/tenants/domains')
      if (listRes.ok) {
        const list = await listRes.json()
        setDomains(list.domains || [])
      }
    } catch (e) {
      console.error('Domain add error:', e)
      setError('Failed to add domain')
    } finally {
      setAddingDomain(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await res.json()
      setLogoUrl(url)
    } catch (err) {
      console.error('Logo upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-[var(--text-muted)]">Loading tenant settings...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[var(--text-primary)]">Tenant not found</p>
          <p className="text-sm text-[var(--text-muted)]">Unable to load tenant information</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General', icon: 'M12 3l8 4v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z' },
    { id: 'customization', label: 'Customization', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'features', label: 'Features', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'integrations', label: 'Integrations', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
    { id: 'subscription', label: 'Subscription', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ] as const

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Tenant Settings</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage your store configuration, branding, features, and subscription
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="group flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500/60 hover:text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border-primary)] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Basic Information</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Core details about your store</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Store Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Tenant Slug
                  </label>
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-muted)] font-mono">
                    {tenant.slug}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Primary Domain
                  </label>
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
                    {primaryDomain || 'No domain configured'}
                  </div>
                </div>
              </div>
            </section>

            {/* Logo */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Brand Logo</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Upload or link to your store logo</p>
              </div>
              
              {logoUrl && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)]">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="h-20 w-auto max-w-[200px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Current Logo</p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-1">{logoUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploadingLogo}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </span>
                  </button>
                </div>
                
                <input
                  type="text"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Or paste image URL"
                />
              </div>

              {uploadError && (
                <p className="text-xs text-[var(--error)]">{uploadError}</p>
              )}
              
              <p className="text-xs text-[var(--text-muted)]">
                Recommended: 200x60px transparent PNG. Max file size: 5MB.
              </p>
            </section>

            {/* Domains */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Custom Domains</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Connect your own domain to your store</p>
              </div>
              
              {domains.length > 0 && (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{domain.domain}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {domain.is_primary && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] font-medium">
                              Primary
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            domain.verified_at 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {domain.verified_at ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {domains.length === 0 && (
                <div className="text-center py-8 rounded-lg border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-elevated)]">
                  <p className="text-sm text-[var(--text-muted)]">No custom domains configured yet</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="store.yourdomain.com"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-secondary)] whitespace-nowrap rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--accent)]/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={makePrimary}
                      onChange={() => setMakePrimary((prev) => !prev)}
                      className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Primary</span>
                  </label>
                  <button
                    onClick={addDomain}
                    disabled={addingDomain || !domainInput.trim()}
                    className="px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {addingDomain ? 'Adding...' : 'Add Domain'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'customization' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Hero Section</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Customize your homepage hero content</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Eyebrow Text
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    value={heroEyebrow}
                    onChange={(e) => setHeroEyebrow(e.target.value)}
                    placeholder={brandName || '709exclusive'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Main Headline
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="Authentic sneakers with local delivery"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Subheadline
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                    rows={3}
                    value={heroSubhead}
                    onChange={(e) => setHeroSubhead(e.target.value)}
                    placeholder="A modern resale marketplace built for your community"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Primary CTA</p>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={heroPrimaryCTA.label}
                      onChange={(e) => setHeroPrimaryCTA({ ...heroPrimaryCTA, label: e.target.value })}
                      placeholder="Button text"
                    />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={heroPrimaryCTA.href}
                      onChange={(e) => setHeroPrimaryCTA({ ...heroPrimaryCTA, href: e.target.value })}
                      placeholder="/shop"
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Secondary CTA</p>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={heroSecondaryCTA.label}
                      onChange={(e) => setHeroSecondaryCTA({ ...heroSecondaryCTA, label: e.target.value })}
                      placeholder="Button text"
                    />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={heroSecondaryCTA.href}
                      onChange={(e) => setHeroSecondaryCTA({ ...heroSecondaryCTA, href: e.target.value })}
                      placeholder="/new-arrivals"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Theme Colors */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Color Theme</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Customize your store's color palette</p>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Quick Presets</p>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { name: 'Midnight Purple', accent: '#A855F7', accent_hover: '#C084FC', accent_muted: '#7E22CE' },
                    { name: 'Ocean Blue', accent: '#3B82F6', accent_hover: '#60A5FA', accent_muted: '#1E40AF' },
                    { name: 'Forest Green', accent: '#10B981', accent_hover: '#34D399', accent_muted: '#047857' },
                    { name: 'Sunset Orange', accent: '#F97316', accent_hover: '#FB923C', accent_muted: '#C2410C' },
                    { name: 'Ruby Red', accent: '#EF4444', accent_hover: '#F87171', accent_muted: '#991B1B' },
                    { name: 'Hot Pink', accent: '#EC4899', accent_hover: '#F472B6', accent_muted: '#BE185D' },
                    { name: 'Neon Magenta', accent: '#FF00FF', accent_hover: '#FF3FFF', accent_muted: '#B800B8' },
                    { name: 'Monochrome', accent: '#6B7280', accent_hover: '#9CA3AF', accent_muted: '#374151' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setColors({
                        accent: preset.accent,
                        accent_hover: preset.accent_hover,
                        accent_muted: preset.accent_muted,
                      })}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-tertiary)] transition-all group"
                    >
                      <div className="flex gap-1">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }}></div>
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent_hover }}></div>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Custom Colors</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Accent</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-10 rounded-lg cursor-pointer border border-[var(--border-primary)]"
                        value={colors.accent || '#A855F7'}
                        onChange={(e) => updateColor('accent', e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                        value={colors.accent || ''}
                        onChange={(e) => updateColor('accent', e.target.value)}
                        placeholder="#A855F7"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Accent Hover</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-10 rounded-lg cursor-pointer border border-[var(--border-primary)]"
                        value={colors.accent_hover || '#C084FC'}
                        onChange={(e) => updateColor('accent_hover', e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                        value={colors.accent_hover || ''}
                        onChange={(e) => updateColor('accent_hover', e.target.value)}
                        placeholder="#C084FC"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Accent Muted</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-10 rounded-lg cursor-pointer border border-[var(--border-primary)]"
                        value={colors.accent_muted || '#7E22CE'}
                        onChange={(e) => updateColor('accent_muted', e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                        value={colors.accent_muted || ''}
                        onChange={(e) => updateColor('accent_muted', e.target.value)}
                        placeholder="#7E22CE"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(colors).length > 0 && (
                <button
                  type="button"
                  onClick={() => setColors({})}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Reset to defaults
                </button>
              )}
            </section>

            {/* Typography */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Typography</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Customize fonts and text sizes</p>
              </div>

              {/* Product Card Typography */}
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Product Cards</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Font Family</label>
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={typography?.product_card?.font_family || 'default'}
                      onChange={(e) => updateTypography('product_card', 'font_family', e.target.value)}
                    >
                      <option value="default">Default (Inter)</option>
                      <option value="system">System</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Card Spacing</label>
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={typography?.product_card?.spacing || 'default'}
                      onChange={(e) => updateTypography('product_card', 'spacing', e.target.value)}
                    >
                      <option value="compact">Compact (1px)</option>
                      <option value="default">Default (1.5px)</option>
                      <option value="comfortable">Comfortable (2px)</option>
                      <option value="spacious">Spacious (3px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Brand Text Size</label>
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={typography?.product_card?.brand_size || 'default'}
                      onChange={(e) => updateTypography('product_card', 'brand_size', e.target.value)}
                    >
                      <option value="xs">Extra Small (9px)</option>
                      <option value="default">Default (10px)</option>
                      <option value="sm">Small (11px)</option>
                      <option value="md">Medium (12px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Product Name Size</label>
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={typography?.product_card?.name_size || 'default'}
                      onChange={(e) => updateTypography('product_card', 'name_size', e.target.value)}
                    >
                      <option value="xs">Extra Small (11px)</option>
                      <option value="default">Default (12px)</option>
                      <option value="sm">Small (13px)</option>
                      <option value="md">Medium (14px)</option>
                      <option value="lg">Large (15px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Price Size</label>
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      value={typography?.product_card?.price_size || 'default'}
                      onChange={(e) => updateTypography('product_card', 'price_size', e.target.value)}
                    >
                      <option value="sm">Small (14px)</option>
                      <option value="default">Default (16px)</option>
                      <option value="md">Medium (18px)</option>
                      <option value="lg">Large (20px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {Object.keys(typography).length > 0 && (
                <button
                  type="button"
                  onClick={() => setTypography({})}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Reset to defaults
                </button>
              )}
            </section>
          </div>
        )}

        {activeTab === 'features' && (
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Feature Toggles</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Enable or disable features for your store</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {featureOptions.map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-all cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={features?.[feature.key] !== false}
                    onChange={() => toggleFeature(feature.key)}
                    className="mt-0.5 rounded border-[var(--border-primary)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {feature.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{feature.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'integrations' && (
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Third-Party Integrations</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Configure external service providers</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Card Payments
                </label>
                <select
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={integrations?.payments?.provider || 'stripe'}
                  onChange={(e) => updateIntegration('payments', e.target.value)}
                >
                  <option value="stripe">Stripe</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Crypto Payments
                </label>
                <select
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={integrations?.payments?.crypto_provider || 'nowpayments'}
                  onChange={(e) => updateCryptoProvider(e.target.value as CryptoProvider)}
                >
                  <option value="nowpayments">NOWPayments</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Email Provider
                </label>
                <select
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={integrations?.email?.provider || 'sendgrid'}
                  onChange={(e) => updateIntegration('email', e.target.value)}
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="postmark">Postmark</option>
                  <option value="resend">Resend</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Delivery Provider
                </label>
                <select
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  value={integrations?.delivery?.provider || 'internal'}
                  onChange={(e) => updateIntegration('delivery', e.target.value)}
                >
                  <option value="internal">Internal</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Platform Info */}
            <section className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">open_people Platform</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 uppercase tracking-wide">
                      Powered by
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Your store is built on the open_people platform — a unified commerce infrastructure for modern businesses.
                  </p>
                </div>
              </div>
            </section>

            {/* Current Plan */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current Subscription</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Manage your open_people platform billing</p>
              </div>
              
              {billing && (
                <div className={`p-5 rounded-xl border-2 ${
                  billing.tier === 'enterprise' 
                    ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-[var(--bg-elevated)] to-[var(--bg-elevated)]'
                    : 'border-[var(--border-primary)] bg-[var(--bg-elevated)]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          {billing.tier === 'enterprise' && (
                            <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                          )}
                          <h3 className="text-xl font-bold text-[var(--text-primary)] capitalize">{billing.tier} Plan</h3>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          billing.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          billing.status === 'trialing' ? 'bg-blue-500/20 text-blue-500' :
                          billing.status === 'past_due' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {billing.status === 'active' ? 'Active' :
                           billing.status === 'trialing' ? 'Trial' :
                           billing.status === 'past_due' ? 'Past Due' :
                           'Canceled'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[var(--text-primary)]">$499</span>
                        <span className="text-[var(--text-muted)]">/month</span>
                      </div>
                      {billing.current_period_end && (
                        <p className="text-sm text-[var(--text-muted)] mt-2">
                          Next billing: {new Date(billing.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        View Invoice
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                  
                  {/* Enterprise Features */}
                  {billing.tier === 'enterprise' && (
                    <div className="mt-5 pt-5 border-t border-[var(--border-primary)]">
                      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">Included Features</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Unlimited Products', 'E2E Encryption', 'Product Drops', 'Crypto Payments', 'Consignments', 'Priority Support'].map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Available Plans */}
            <section className="space-y-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Choose Your Plan</h3>
                <p className="text-[var(--text-muted)] mt-2">Scale your business with the right tools</p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                {/* Starter */}
                <div className="group relative rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)] transition-all duration-300 overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Starter</h4>
                      <p className="text-sm text-[var(--text-muted)]">Perfect for getting started</p>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">$99</span>
                      <span className="text-[var(--text-muted)] font-medium">/mo</span>
                    </div>
                    
                    <div className="h-px bg-[var(--border-primary)]"></div>
                    
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Up to 100 products</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Essential inventory tools</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Customer messaging</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Secure payments</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-8 pt-0">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan('starter')}
                      disabled={billing?.tier === 'starter'}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border-primary)] disabled:hover:text-[var(--text-primary)]"
                    >
                      {billing?.tier === 'starter' ? '✓ Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                </div>

                {/* Professional */}
                <div className="group relative rounded-2xl bg-gradient-to-b from-[var(--accent)] to-[var(--accent-muted)] p-[2px] overflow-visible transform md:scale-105 shadow-xl shadow-[var(--accent)]/20 mt-6">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold tracking-wide shadow-lg">
                      RECOMMENDED
                    </div>
                  </div>
                  
                  <div className="rounded-2xl bg-[var(--bg-secondary)] h-full">
                    <div className="p-8 pt-12 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Professional</h4>
                        <p className="text-sm text-[var(--text-muted)]">Built for growth</p>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">$199</span>
                        <span className="text-[var(--text-muted)] font-medium">/mo</span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent"></div>
                      
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Unlimited products</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Product drops & alerts</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">End-to-end encryption</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Local delivery & pickup</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Advanced analytics</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-8 pt-0">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan('professional')}
                        disabled={billing?.tier === 'professional'}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent)]/30 hover:shadow-xl hover:shadow-[var(--accent)]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {billing?.tier === 'professional' ? '✓ Current Plan' : 'Get Started'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enterprise */}
                <div className={`group relative rounded-2xl overflow-visible ${
                  billing?.tier === 'enterprise'
                    ? 'bg-gradient-to-b from-purple-500 to-purple-600 p-[2px] transform md:scale-105 shadow-xl shadow-purple-500/20 mt-6'
                    : 'border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)] transition-all duration-300'
                }`}>
                  {billing?.tier === 'enterprise' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 rounded-full bg-purple-500 text-white text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        YOUR PLAN
                      </div>
                    </div>
                  )}
                  
                  <div className={`${billing?.tier === 'enterprise' ? 'rounded-2xl bg-[var(--bg-secondary)] h-full' : ''}`}>
                    <div className={`p-8 space-y-6 ${billing?.tier === 'enterprise' ? 'pt-12' : ''}`}>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Enterprise</h4>
                        <p className="text-sm text-[var(--text-muted)]">Maximum performance</p>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">$499</span>
                        <span className="text-[var(--text-muted)] font-medium">/mo</span>
                      </div>
                      
                      <div className={`h-px ${billing?.tier === 'enterprise' ? 'bg-gradient-to-r from-transparent via-purple-500/30 to-transparent' : 'bg-[var(--border-primary)]'}`}></div>
                      
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${billing?.tier === 'enterprise' ? 'text-purple-400' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={billing?.tier === 'enterprise' ? 'font-medium' : ''}>All Professional features</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${billing?.tier === 'enterprise' ? 'text-purple-400' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={billing?.tier === 'enterprise' ? 'font-medium' : ''}>Cryptocurrency payments</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${billing?.tier === 'enterprise' ? 'text-purple-400' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={billing?.tier === 'enterprise' ? 'font-medium' : ''}>Consignment management</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${billing?.tier === 'enterprise' ? 'text-purple-400' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={billing?.tier === 'enterprise' ? 'font-medium' : ''}>Priority support</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${billing?.tier === 'enterprise' ? 'text-purple-400' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={billing?.tier === 'enterprise' ? 'font-medium' : ''}>Custom integrations</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-8 pt-0">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan('enterprise')}
                        disabled={billing?.tier === 'enterprise'}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                          billing?.tier === 'enterprise'
                            ? 'bg-purple-500/20 text-purple-400 cursor-default'
                            : 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-purple-500 hover:text-purple-400'
                        }`}
                      >
                        {billing?.tier === 'enterprise' ? '✓ Current Plan' : 'Upgrade Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Billing History */}
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Billing History</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">View your past invoices and payments</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  View All
                </button>
              </div>
              
              <div className="text-center py-8 rounded-lg border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-elevated)]">
                <p className="text-sm text-[var(--text-muted)]">No billing history available</p>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Mock Checkout Modal */}
      {showCheckoutModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-primary)] bg-gradient-to-r from-[var(--bg-tertiary)] to-transparent">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {checkoutStep === 'success' ? 'Welcome to ' + PLAN_DETAILS[selectedPlan].name + '!' : 
                     checkoutStep === 'processing' ? 'Processing Payment...' :
                     'Upgrade to ' + PLAN_DETAILS[selectedPlan].name}
                  </h2>
                  {checkoutStep === 'payment' && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {billing?.tier ? `Changing from ${PLAN_DETAILS[billing.tier].name} plan` : 'Complete your subscription'}
                    </p>
                  )}
                </div>
                {checkoutStep !== 'processing' && (
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false)
                      setSelectedPlan(null)
                      setCheckoutStep('select')
                    }}
                    className="p-2 -mr-2 -mt-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {checkoutStep === 'payment' && (
                <div className="space-y-6">
                  {/* Plan Summary */}
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{PLAN_DETAILS[selectedPlan].name} Plan</p>
                        <p className="text-sm text-[var(--text-muted)]">{PLAN_DETAILS[selectedPlan].description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">${PLAN_DETAILS[selectedPlan].price}</p>
                        <p className="text-xs text-[var(--text-muted)]">per month</p>
                      </div>
                    </div>
                    
                    {/* Price difference */}
                    {billing?.tier && PLAN_DETAILS[selectedPlan].price !== PLAN_DETAILS[billing.tier].price && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-muted)]">
                            {PLAN_DETAILS[selectedPlan].price > PLAN_DETAILS[billing.tier].price ? 'Additional cost' : 'You save'}
                          </span>
                          <span className={PLAN_DETAILS[selectedPlan].price > PLAN_DETAILS[billing.tier].price ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                            ${Math.abs(PLAN_DETAILS[selectedPlan].price - PLAN_DETAILS[billing.tier].price)}/mo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mock Credit Card Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={mockCardNumber}
                          onChange={(e) => setMockCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 font-mono"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <svg className="w-8 h-5 text-[var(--text-muted)]" viewBox="0 0 32 20" fill="currentColor">
                            <rect x="0" y="0" width="32" height="20" rx="3" fill="currentColor" opacity="0.1"/>
                            <circle cx="12" cy="10" r="5" fill="#EB001B" opacity="0.8"/>
                            <circle cx="20" cy="10" r="5" fill="#F79E1B" opacity="0.8"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Expiry</label>
                        <input
                          type="text"
                          value={mockCardExpiry}
                          onChange={(e) => setMockCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">CVC</label>
                        <input
                          type="text"
                          value={mockCardCvc}
                          onChange={(e) => setMockCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Test Mode Notice */}
                  <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-[var(--warning)]">Test Mode</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          This is a mock payment. Use any card number (e.g., 4242 4242 4242 4242).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleMockPayment}
                    disabled={!isPaymentFormValid}
                    className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent)]/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Pay ${PLAN_DETAILS[selectedPlan].price}/month
                  </button>
                  
                  <p className="text-center text-xs text-[var(--text-muted)]">
                    By confirming, you agree to the terms of service. Cancel anytime.
                  </p>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--accent)] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Processing your payment...</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">Please wait while we confirm your subscription.</p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Payment Successful!</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    You&apos;re now on the {PLAN_DETAILS[selectedPlan].name} plan.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Amount charged</span>
                      <span className="font-semibold text-[var(--text-primary)]">${PLAN_DETAILS[selectedPlan].price}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-[var(--text-muted)]">Next billing date</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
