import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type MaintenanceValue = { enabled?: boolean; message?: string | null }

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET() {
  const supabase = getClient()
  if (!supabase) return NextResponse.json({ enabled: false, message: null })

  const { data } = await supabase
    .from('site_flags')
    .select('value')
    .eq('key', 'maintenance_mode')
    .maybeSingle()

  const value = (data?.value || {}) as MaintenanceValue
  const enabled = Boolean(value.enabled)
  const message = value.message ?? null

  return NextResponse.json(
    { enabled, message },
    { headers: { 'Cache-Control': 'private, max-age=0, s-maxage=5' } }
  )
}
