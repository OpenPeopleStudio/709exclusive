import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

type MaintenanceValue = { enabled: boolean; message: string | null }

async function requireAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { error: NextResponse.json({ error: 'Owner access required' }, { status: 403 }) }
  }

  return { supabase }
}

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data } = await supabase
    .from('site_flags')
    .select('value')
    .eq('key', 'maintenance_mode')
    .maybeSingle()

  const value = (data?.value || {}) as Partial<MaintenanceValue>

  return NextResponse.json({
    enabled: Boolean(value.enabled),
    message: value.message ?? null,
  })
}

export async function PATCH(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = (await request.json().catch(() => null)) as Partial<MaintenanceValue> | null
  if (!body || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : null

  const { error: upsertError } = await supabase
    .from('site_flags')
    .upsert({
      key: 'maintenance_mode',
      value: { enabled: body.enabled, message: message || null },
      updated_at: new Date().toISOString(),
    })

  if (upsertError) {
    console.error('Maintenance update error:', upsertError)
    return NextResponse.json({ error: 'Failed to update maintenance mode' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
