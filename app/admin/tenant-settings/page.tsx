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

const featureOptions: Array<{ key: keyof TenantFeatureFlags; label: string }> = [
  { key: 'drops', label: 'Drops' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'messages', label: 'Messages' },
  { key: 'e2e_encryption', label: 'E2E Encryption' },
  { key: 'crypto_payments', label: 'Crypto payments' },
  { key: 'local_delivery', label: 'Local delivery' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'admin', label: 'Admin tools' },
  { key: 'consignments', label: 'Consignments' },
]

type CryptoProvider = TenantIntegrations['payments'] extends { crypto_provider?: infer T } ? T : never

export default function TenantSettingsPage() {
  const [tenant, setTenant] = useState<TenantRecord | null>(null)
  const [domains, setDomains] = useState<TenantDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [features, setFeatures] = useState<TenantFeatureFlags>({})
  const [integrations, setIntegrations] = useState<TenantIntegrations>({})
  const [domainInput, setDomainInput] = useState('')
  const [makePrimary, setMakePrimary] = useState(true)
  const [addingDomain, setAddingDomain] = useState(false)

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
          setFeatures(data.tenant?.settings?.features || {})
          setIntegrations(data.tenant?.settings?.integrations || {})
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
            theme: { brand_name: brandName },
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

  if (loading) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Loading tenant settings...</div>
  }

  if (!tenant) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Tenant not found.</div>
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Tenant Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage branding, features, and integrations for this tenant.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Branding</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-[var(--text-secondary)]">
            Brand name
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Brand name"
            />
          </label>
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="mb-2">Tenant slug</p>
            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]">
              {tenant.slug}
            </div>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="mb-2">Primary domain</p>
            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]">
              {primaryDomain || 'Not set'}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Feature Flags</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {featureOptions.map((feature) => (
            <label key={feature.key} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={features?.[feature.key] !== false}
                onChange={() => toggleFeature(feature.key)}
              />
              {feature.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-[var(--text-secondary)]">
            Card payments
            <select
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={integrations?.payments?.provider || 'stripe'}
              onChange={(e) => updateIntegration('payments', e.target.value)}
            >
              <option value="stripe">Stripe</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Crypto payments
            <select
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={integrations?.payments?.crypto_provider || 'nowpayments'}
              onChange={(e) => updateCryptoProvider(e.target.value as CryptoProvider)}
            >
              <option value="nowpayments">NOWPayments</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Email provider
            <select
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={integrations?.email?.provider || 'sendgrid'}
              onChange={(e) => updateIntegration('email', e.target.value)}
            >
              <option value="sendgrid">SendGrid</option>
              <option value="postmark">Postmark</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Delivery provider
            <select
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={integrations?.delivery?.provider || 'internal'}
              onChange={(e) => updateIntegration('delivery', e.target.value)}
            >
              <option value="internal">Internal</option>
              <option value="manual">Manual</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Domains</h2>
        <div className="space-y-2">
          {domains.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No domains configured yet.</p>
          )}
          {domains.map((domain) => (
            <div key={domain.id} className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-3 text-sm">
              <div>
                <p className="text-[var(--text-primary)]">{domain.domain}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {domain.is_primary ? 'Primary' : 'Secondary'} • {domain.verified_at ? 'Verified' : 'Unverified'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
          <label className="text-sm text-[var(--text-secondary)]">
            Add domain
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="store.example.com"
            />
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={makePrimary}
                onChange={() => setMakePrimary((prev) => !prev)}
              />
              Make primary
            </label>
            <button
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={addDomain}
              disabled={addingDomain}
            >
              {addingDomain ? 'Adding...' : 'Add domain'}
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
