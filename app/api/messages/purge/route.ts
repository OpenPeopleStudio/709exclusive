import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { hasAdminAccess } from '@/lib/roles'
import { redactErrorMessage } from '@/lib/privacy'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { customerId, days } = await request.json()

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = hasAdminAccess(profile?.role)
  const targetCustomerId = customerId || user.id

  if (customerId && !isAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (!days || days <= 0) {
    return NextResponse.json({ error: 'Retention days required' }, { status: 400 })
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: targets } = await supabase
    .from('messages')
    .select('id, attachment_path')
    .eq('customer_id', targetCustomerId)
    .is('deleted_at', null)
    .lt('created_at', cutoff)

  const { data, error } = await supabase
    .from('messages')
    .update({
      deleted_at: now,
      deleted_by: user.id,
      deleted_for_both: true,
      content: '',
      encrypted: false,
      iv: null,
      sender_public_key: null,
      message_index: 0,
      attachment_path: null,
      attachment_name: null,
      attachment_type: null,
      attachment_size: null,
      attachment_key: null,
      attachment_key_iv: null,
      attachment_key_sender_public_key: null,
      attachment_key_message_index: null,
    })
    .eq('customer_id', targetCustomerId)
    .is('deleted_at', null)
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to purge messages') }, { status: 500 })
  }

  const paths = (targets || [])
    .map((item) => item.attachment_path)
    .filter((path): path is string => Boolean(path))

  if (paths.length > 0) {
    await supabase.storage.from('message-attachments').remove(paths)
  }

  return NextResponse.json({ success: true, purged: data?.length || 0 })
}
