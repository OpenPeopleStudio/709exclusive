import { createClient } from '@supabase/supabase-js'

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const retentionHours = Number(process.env.STAFF_LOCATION_RETENTION_HOURS || 48)
if (!Number.isFinite(retentionHours) || retentionHours <= 0) {
  console.error('STAFF_LOCATION_RETENTION_HOURS must be a positive number')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const run = async () => {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('staff_locations')
    .delete()
    .lt('expires_at', now)
    .select('id')

  if (error) throw error

  console.log(`Deleted ${data?.length || 0} expired staff location points.`)
}

try {
  await run()
} catch (error) {
  console.error('Cleanup failed:', error)
  process.exitCode = 1
}
