#!/usr/bin/env node
/**
 * Populate Product Images via Unsplash
 * 
 * Uses Unsplash API to find sneaker images.
 * Good for generic sneaker photos, less precise for specific colorways.
 * 
 * Usage:
 *   node scripts/populate-images-unsplash.mjs --dry-run
 *   node scripts/populate-images-unsplash.mjs --brand "Nike" --limit 20
 * 
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   UNSPLASH_ACCESS_KEY
 */

import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const brandIndex = args.indexOf('--brand')
const brandFilter = brandIndex !== -1 ? args[brandIndex + 1] : null
const limitIndex = args.indexOf('--limit')
const limitCount = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : 50

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!unsplashKey) {
  console.error('❌ Missing UNSPLASH_ACCESS_KEY')
  console.error('   Get a free key at https://unsplash.com/developers')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

let processed = 0, updated = 0, skipped = 0

async function searchUnsplash(brand, model) {
  // Unsplash works better with simpler queries
  const query = `${brand} sneaker ${model.split('—')[0]}`.trim()
  
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      {
        headers: { 'Authorization': `Client-ID ${unsplashKey}` }
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.results?.[0]?.urls?.regular || null
  } catch (error) {
    return null
  }
}

async function getProductsWithoutImages() {
  let query = supabase
    .from('products')
    .select('id, name, brand')
    .is('external_image_url', null)
    .order('brand')
    .limit(limitCount)

  if (brandFilter) {
    query = query.ilike('brand', brandFilter)
  }

  const { data } = await query
  return data || []
}

async function main() {
  console.log('🔍 Unsplash Image Populator')
  console.log('='.repeat(50))
  if (dryRun) console.log('🏃 DRY RUN MODE\n')

  const products = await getProductsWithoutImages()
  console.log(`Found ${products.length} products needing images\n`)

  for (const product of products) {
    processed++
    process.stdout.write(`[${processed}/${products.length}] ${product.brand} ${product.name}... `)
    
    const imageUrl = await searchUnsplash(product.brand, product.name)
    
    if (imageUrl && !dryRun) {
      await supabase
        .from('products')
        .update({ external_image_url: imageUrl, data_source: 'unsplash' })
        .eq('id', product.id)
      console.log('✅')
      updated++
    } else if (imageUrl) {
      console.log('✅ (dry run)')
      updated++
    } else {
      console.log('⚠️ No image')
      skipped++
    }
    
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n📊 Done: ${updated} updated, ${skipped} skipped`)
}

main().catch(console.error)
