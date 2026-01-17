import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { redactErrorMessage } from '@/lib/privacy'

export async function POST() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const now = new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from('staff_locations')
      .delete()
      .lt('expires_at', now)
      .select('id')

    if (error) {
      return NextResponse.json({ error: redactErrorMessage('Failed to purge locations') }, { status: 500 })
    }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'cleanup_staff_locations',
      entity_type: 'staff_location',
      entity_id: null,
      details: { deleted: data?.length || 0 },
    })

    return NextResponse.json({ success: true, deleted: data?.length || 0 })
  } catch (error) {
    console.error('Staff location cleanup error:', error)
    return NextResponse.json({ error: redactErrorMessage('Cleanup failed') }, { status: 500 })
  }
}
