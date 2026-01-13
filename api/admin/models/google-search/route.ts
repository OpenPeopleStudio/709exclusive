import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { searchGoogleImages } from '@/lib/imageSources/google'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { brand, model }: { brand: string; model: string } = await req.json()

    if (!brand?.trim() || !model?.trim()) {
      return NextResponse.json({ error: 'Brand and model required' }, { status: 400 })
    }

    const images = await searchGoogleImages({
      brand: brand.trim(),
      model: model.trim(),
      limit: 20
    })

    return NextResponse.json({ images })

  } catch (error) {
    console.error('Google image search error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 })
  }
}