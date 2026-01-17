import { headers } from 'next/headers'
import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabaseServer'
import type { TenantContextValue, TenantSettings } from '@/types/tenant'

export const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || '709exclusive'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || ''

const normalizeHost = (host: string | null) => {
  if (!host) return ''
  return host.replace(/:\d+$/, '').trim().toLowerCase()
}

const extractSlugFromHost = (host: string) => {
  if (!host) return ''
  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.replace(`.${ROOT_DOMAIN}`, '')
  }
  if (host.endsWith('.localhost')) {
    return host.split('.')[0]
  }
  return ''
}

const toTenantContext = (tenant: {
  id: string
  slug: string
  name: string
  primary_domain: string | null
  settings: TenantSettings | null
}): TenantContextValue => ({
  id: tenant.id,
  slug: tenant.slug,
  name: tenant.name,
  primary_domain: tenant.primary_domain,
  settings: (tenant.settings ?? {}) as TenantSettings,
})

async function fetchTenantById(tenantId: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings')
    .eq('id', tenantId)
    .single()
  if (error || !data) return null
  return toTenantContext(data)
}

async function fetchTenantBySlug(slug: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return toTenantContext(data)
}

async function fetchTenantByDomain(domain: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('tenant_domains')
    .select('tenant_id')
    .eq('domain', domain)
    .single()
  if (error || !data?.tenant_id) return null
  return fetchTenantById(data.tenant_id)
}

export async function resolveTenantByHost(rawHost: string) {
  const host = normalizeHost(rawHost)
  if (!host) {
    return fetchTenantBySlug(DEFAULT_TENANT_SLUG)
  }

  const domainMatch = await fetchTenantByDomain(host)
  if (domainMatch) return domainMatch

  const supabase = await createSupabaseServer()
  const { data: primaryMatch } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings')
    .eq('primary_domain', host)
    .single()
  if (primaryMatch) return toTenantContext(primaryMatch)

  const slugCandidate = extractSlugFromHost(host)
  if (slugCandidate) {
    const slugMatch = await fetchTenantBySlug(slugCandidate)
    if (slugMatch) return slugMatch
  }

  return fetchTenantBySlug(DEFAULT_TENANT_SLUG)
}

type HeaderSource = Pick<Headers, 'get'>

export const getTenantFromHeaders = cache(async (headerStore: HeaderSource) => {
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || ''
  return resolveTenantByHost(host)
})

export async function getTenantFromRequest(request?: Request) {
  if (request) {
    return getTenantFromHeaders(request.headers)
  }
  const headerStore = await headers()
  return getTenantFromHeaders(headerStore)
}
