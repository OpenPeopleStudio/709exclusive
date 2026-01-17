import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { getTenantFromRequest } from '@/lib/tenant'
import { isOwner } from '@/lib/roles'

const TRIAL_DAYS = 14
const TENANT_STATUSES = new Set(['active', 'inactive', 'suspended'])

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const isValidSlug = (value: string) =>
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)

const normalizeDomain = (value: string) => value.trim().toLowerCase()

const isValidDomain = (value: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)

async function requireSuperAdmin(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: superTenant } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', '709exclusive')
    .maybeSingle()

  if (!superTenant?.id) {
    return { error: NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 }) }
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', superTenant.id)
    .single()

  if (!isOwner(profile?.role)) {
    return { error: NextResponse.json({ error: 'Owner access required' }, { status: 403 }) }
  }

  if (tenant?.slug && tenant.slug !== superTenant.slug) {
    return { error: NextResponse.json({ error: 'Internal access required' }, { status: 403 }) }
  }

  return { supabase, user }
}

export async function GET(request: Request) {
  const auth = await requireSuperAdmin(request)
  if ('error' in auth) return auth.error

  const { supabase } = auth
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      status,
      primary_domain,
      settings,
      created_at,
      updated_at,
      tenant_domains(domain, is_primary, verified_at),
      tenant_billing(plan, status, billing_email, trial_ends_at)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Tenant list error:', error)
    return NextResponse.json({ error: 'Failed to load tenants' }, { status: 500 })
  }

  return NextResponse.json({ tenants: tenants || [] })
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin(request)
  if ('error' in auth) return auth.error

  const { supabase, user } = auth

  let payload: {
    name?: string
    slug?: string
    primaryDomain?: string
    billingEmail?: string
    plan?: string
    status?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const rawSlug = typeof payload.slug === 'string' ? payload.slug : name
  const slug = normalizeSlug(rawSlug)
  const primaryDomain = typeof payload.primaryDomain === 'string'
    ? normalizeDomain(payload.primaryDomain)
    : ''
  const billingEmail = typeof payload.billingEmail === 'string'
    ? payload.billingEmail.trim().toLowerCase()
    : ''
  const plan = typeof payload.plan === 'string' && payload.plan.trim()
    ? payload.plan.trim()
    : 'starter'
  const status = typeof payload.status === 'string' && payload.status.trim()
    ? payload.status.trim()
    : 'active'

  if (!name || !slug) {
    return NextResponse.json({ error: 'Tenant name and slug are required' }, { status: 400 })
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid tenant slug' }, { status: 400 })
  }

  if (primaryDomain && !isValidDomain(primaryDomain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }
  if (!TENANT_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid tenant status' }, { status: 400 })
  }

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingTenant) {
    return NextResponse.json({ error: 'Tenant slug already in use' }, { status: 409 })
  }

  if (primaryDomain) {
    const { data: existingDomain } = await supabase
      .from('tenant_domains')
      .select('id')
      .eq('domain', primaryDomain)
      .maybeSingle()

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already claimed' }, { status: 409 })
    }

    const { data: existingPrimary } = await supabase
      .from('tenants')
      .select('id')
      .eq('primary_domain', primaryDomain)
      .maybeSingle()

    if (existingPrimary) {
      return NextResponse.json({ error: 'Domain already assigned' }, { status: 409 })
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      status,
      primary_domain: primaryDomain || null,
      settings: {
        theme: { brand_name: name },
      },
    })
    .select('id, name, slug, status, primary_domain, settings, created_at, updated_at')
    .single()

  if (tenantError || !tenant) {
    console.error('Tenant creation error:', tenantError)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: billingError } = await supabase
    .from('tenant_billing')
    .insert({
      tenant_id: tenant.id,
      billing_email: billingEmail || null,
      plan,
      status: 'trialing',
      trial_ends_at: trialEndsAt,
    })

  if (billingError) {
    console.error('Tenant billing error:', billingError)
    return NextResponse.json({ error: 'Failed to initialize billing' }, { status: 500 })
  }

  if (primaryDomain) {
    const { error: domainError } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: tenant.id,
        domain: primaryDomain,
        is_primary: true,
      })

    if (domainError) {
      console.error('Tenant domain error:', domainError)
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
    }
  }

  await supabase.from('activity_logs').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    user_email: user.email,
    action: 'tenant_created',
    entity_type: 'tenant',
    entity_id: tenant.id,
    details: {
      name,
      slug,
      primary_domain: primaryDomain || null,
      status,
      plan,
    },
  })

  const { data: tenantWithBilling } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      status,
      primary_domain,
      settings,
      created_at,
      updated_at,
      tenant_domains(domain, is_primary, verified_at),
      tenant_billing(plan, status, billing_email, trial_ends_at)
    `)
    .eq('id', tenant.id)
    .single()

  return NextResponse.json({ tenant: tenantWithBilling || tenant })
}
