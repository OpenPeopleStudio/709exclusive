import { supabase } from './supabaseClient'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return profile
}