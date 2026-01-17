import { createClient } from '@supabase/supabase-js'

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

if (process.env.SMOKE_TEST_CONFIRM !== 'YES') {
  console.error('Set SMOKE_TEST_CONFIRM=YES to run this script.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const now = Date.now()
const slug = `smoke-tenant-${now}`
const name = `Smoke Tenant ${now}`

let tenantId
let authUserId

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const run = async () => {
  console.log('Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: `smoke-${now}@example.com`,
    password: `smoke-password-${now}`,
    email_confirm: true,
  })

  if (authError) throw authError
  authUserId = authData.user.id

  console.log('Creating tenant...')
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      status: 'active',
      settings: { theme: { brand_name: name } },
    })
    .select('id, name, slug, status')
    .single()

  if (tenantError) throw tenantError
  tenantId = tenant.id
  assert(tenant.slug === slug, 'Tenant slug mismatch')
  assert(tenant.status === 'active', 'Tenant should be active')

  console.log('Creating tenant billing...')
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: billing, error: billingError } = await supabase
    .from('tenant_billing')
    .insert({
      tenant_id: tenantId,
      billing_email: `smoke-billing-${now}@example.com`,
      plan: 'starter',
      status: 'trialing',
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single()

  if (billingError) throw billingError
  assert(billing.plan === 'starter', 'Billing plan should be starter')
  assert(billing.status === 'trialing', 'Billing status should be trialing')

  console.log('Assigning user as owner...')
  const { error: profileError } = await supabase
    .from('709_profiles')
    .upsert({
      id: authUserId,
      role: 'owner',
      tenant_id: tenantId,
    })

  if (profileError) throw profileError

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role, tenant_id')
    .eq('id', authUserId)
    .single()

  assert(profile.role === 'owner', 'Profile role should be owner')
  assert(profile.tenant_id === tenantId, 'Profile tenant_id should match')

  console.log('Updating billing status...')
  const { error: updateError } = await supabase
    .from('tenant_billing')
    .update({ status: 'active' })
    .eq('tenant_id', tenantId)

  if (updateError) throw updateError

  const { data: updatedBilling } = await supabase
    .from('tenant_billing')
    .select('status')
    .eq('tenant_id', tenantId)
    .single()

  assert(updatedBilling.status === 'active', 'Billing status should be active after update')

  console.log('Smoke test passed.')
}

try {
  await run()
} catch (error) {
  console.error('Smoke test failed:', error)
  process.exitCode = 1
} finally {
  console.log('Cleaning up...')
  if (tenantId) {
    await supabase.from('tenants').delete().eq('id', tenantId)
  }
  if (authUserId) {
    await supabase.auth.admin.deleteUser(authUserId)
  }
}
