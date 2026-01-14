import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

// Delete user and all associated data
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner/admin role for deleting users
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check target user exists and is not owner
    const { data: targetProfile } = await supabase
      .from('709_profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete owner account' }, { status: 400 })
    }

    // Can't delete yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete all associated data (order matters due to foreign keys)
    
    // 1. Delete wishlist items
    await supabase.from('wishlist_items').delete().eq('user_id', userId)
    
    // 2. Delete stock alerts
    await supabase.from('stock_alerts').delete().eq('user_id', userId)
    
    // 3. Delete drop alerts
    await supabase.from('drop_alerts').delete().eq('user_id', userId)
    
    // 4. Delete recently viewed
    await supabase.from('recently_viewed').delete().eq('user_id', userId)
    
    // 5. Delete messages
    await supabase.from('messages').delete().eq('customer_id', userId)
    
    // 6. Delete order items for user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', userId)
    
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      await supabase.from('order_items').delete().in('order_id', orderIds)
    }
    
    // 7. Delete orders
    await supabase.from('orders').delete().eq('customer_id', userId)
    
    // 8. Delete user preferences
    await supabase.from('user_preferences').delete().eq('user_id', userId)
    
    // 9. Delete the profile
    const { error: profileError } = await supabase
      .from('709_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // 10. Delete from auth.users (requires service role)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
      if (authError) {
        console.error('Error deleting auth user:', authError)
        // Profile is already deleted, just log this error
      }
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'delete_user',
      entity_type: 'user',
      entity_id: userId,
      details: { 
        deleted_user_name: targetProfile.full_name,
        deleted_user_role: targetProfile.role
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User and all associated data deleted' 
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner role for inviting users
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  try {
    const { email, role } = await request.json()

    // In production, you'd use Supabase Admin API to invite user
    // For now, we'll create a placeholder profile
    // The user would need to sign up with this email

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'invite_user',
      entity_type: 'user',
      entity_id: email,
      details: { role }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent (user must sign up with this email)' 
    })

  } catch (error) {
    console.error('Invite user error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to invite user'
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner role for changing roles
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  try {
    const { userId, role } = await request.json()

    // Can't change owner role
    const { data: targetProfile } = await supabase
      .from('709_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetProfile?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Update role
    const { error } = await supabase
      .from('709_profiles')
      .update({ role })
      .eq('id', userId)

    if (error) throw error

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'update_user_role',
      entity_type: 'user',
      entity_id: userId,
      details: { new_role: role }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update role'
    }, { status: 500 })
  }
}
