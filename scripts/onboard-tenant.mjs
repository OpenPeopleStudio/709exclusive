import { createClient } from '@supabase/supabase-js'

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TENANT_NAME',
  'TENANT_SLUG',
]

const missing = requiredEnv.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const name = process.env.TENANT_NAME.trim()
const slug = process.env.TENANT_SLUG.trim()
const domain = process.env.TENANT_DOMAIN?.trim().toLowerCase() || null
const billingEmail = process.env.TENANT_BILLING_EMAIL?.trim().toLowerCase() || null
const ownerUserId = process.env.TENANT_OWNER_USER_ID?.trim() || null

if (!name || !slug) {
  console.error('TENANT_NAME and TENANT_SLUG are required')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const run = async () => {
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingTenant) {
    console.error(`Tenant slug already exists: ${slug}`)
    process.exit(1)
  }

  if (domain) {
    const { data: existingDomain } = await supabase
      .from('tenant_domains')
      .select('id')
      .eq('domain', domain)
      .maybeSingle()

    if (existingDomain) {
      console.error(`Domain already claimed: ${domain}`)
      process.exit(1)
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      primary_domain: domain,
      settings: {
        theme: { brand_name: name },
      },
    })
    .select('id, name, slug')
    .single()

  if (tenantError || !tenant) {
    throw tenantError || new Error('Failed to create tenant')
  }

  if (domain) {
    const { error: domainError } = await supabase
      .from('tenant_domains')
      .insert({ tenant_id: tenant.id, domain, is_primary: true })
    if (domainError) throw domainError
  }

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { error: billingError } = await supabase
    .from('tenant_billing')
    .insert({
      tenant_id: tenant.id,
      billing_email: billingEmail,
      plan: 'starter',
      status: 'trialing',
      trial_ends_at: trialEndsAt,
    })
  if (billingError) throw billingError

  if (ownerUserId) {
    const { error: profileError } = await supabase
      .from('709_profiles')
      .update({ tenant_id: tenant.id, role: 'owner' })
      .eq('id', ownerUserId)
    if (profileError) throw profileError
  }

  console.log(`Created tenant ${tenant.name} (${tenant.slug}).`)
  if (domain) {
    console.log(`Primary domain: ${domain}`)
  }
  if (ownerUserId) {
    console.log(`Assigned owner user: ${ownerUserId}`)
  }
}

try {
  await run()
} catch (error) {
  console.error('Tenant onboarding failed:', error)
  process.exitCode = 1
}
