import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
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

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { modelId, images } = await request.json()

    // Get model info
    const { data: modelInfo } = await supabase
      .from('product_models')
      .select('brand, model')
      .eq('id', modelId)
      .single()

    if (!modelInfo) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Find product for this model
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('brand', modelInfo.brand)
      .eq('name', modelInfo.model)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Add images to product_images
    let attached = 0
    for (const image of images) {
      // If it's a model image, just link it
      if (image.isModelImage) {
        const { error } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: image.url,
            is_primary: image.isPrimary,
            sort_order: attached
          })

        if (!error) attached++
      } else {
        // For new uploads, you'd typically upload to Supabase Storage here
        // For now, we'll just store the URL
        const { error } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: image.url,
            is_primary: image.isPrimary,
            sort_order: attached
          })

        if (!error) attached++
      }
    }

    // If setting a new primary, unset others
    const primaryImage = images.find((img: { isPrimary: boolean }) => img.isPrimary)
    if (primaryImage) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', product.id)
        .neq('url', primaryImage.url)
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'attach_product_images',
      entity_type: 'product',
      entity_id: product.id,
      details: { modelId, attached, total: images.length }
    })

    return NextResponse.json({ 
      success: true, 
      attached
    })

  } catch (error) {
    console.error('Photo attach error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to attach photos'
    }, { status: 500 })
  }
}
