#!/usr/bin/env node
/**
 * Populate Product Images Script
 * 
 * Fetches images from KicksDB API for all products without images
 * and updates the external_image_url field.
 * 
 * Usage:
 *   # Dry run (see what would be updated)
 *   node scripts/populate-product-images.mjs --dry-run
 * 
 *   # Actually update the database
 *   node scripts/populate-product-images.mjs
 * 
 *   # Limit to specific brand
 *   node scripts/populate-product-images.mjs --brand "Jordan"
 * 
 *   # Process specific number
 *   node scripts/populate-product-images.mjs --limit 50
 * 
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   KICKSDB_API_KEY
 */

import { createClient } from '@supabase/supabase-js'

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const brandIndex = args.indexOf('--brand')
const brandFilter = brandIndex !== -1 ? args[brandIndex + 1] : null
const limitIndex = args.indexOf('--limit')
const limitCount = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null

// Environment check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const kicksdbApiKey = process.env.KICKSDB_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n   Run with: source .env.local && node scripts/populate-product-images.mjs')
  process.exit(1)
}

if (!kicksdbApiKey) {
  console.error('❌ Missing KICKSDB_API_KEY')
  console.error('   Get a free API key at https://kicks.dev')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Stats
let processed = 0
let updated = 0
let failed = 0
let skipped = 0

/**
 * Search KicksDB for a sneaker image
 */
async function searchKicksDB(brand, model) {
  // Build search query - combine brand and model for best results
  const query = `${brand} ${model}`.trim()
  
  try {
    const response = await fetch(
      `https://api.kicks.dev/v1/search?q=${encodeURIComponent(query)}&per_page=3`,
      {
        headers: {
          'Authorization': `Bearer ${kicksdbApiKey}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.log('⏳ Rate limited, waiting 60 seconds...')
        await sleep(60000)
        return searchKicksDB(brand, model) // Retry
      }
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (data.products && data.products.length > 0) {
      // Find best match - prefer exact brand match
      const match = data.products.find(p => 
        p.brand?.toLowerCase() === brand.toLowerCase()
      ) || data.products[0]
      
      // Get the best image URL
      const imageUrl = match.image?.original || 
                       match.image?.small || 
                       match.image?.thumbnail ||
                       null
      
      return {
        imageUrl,
        sku: match.sku || null,
        externalId: match.id || null
      }
    }
    
    return { imageUrl: null, sku: null, externalId: null }
  } catch (error) {
    console.error(`   Error searching for "${query}":`, error.message)
    return { imageUrl: null, sku: null, externalId: null }
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get products without images
 */
async function getProductsWithoutImages() {
  let query = supabase
    .from('products')
    .select('id, name, brand, slug, external_image_url')
    .is('external_image_url', null)
    .order('brand')
    .order('name')

  if (brandFilter) {
    query = query.ilike('brand', brandFilter)
  }

  if (limitCount) {
    query = query.limit(limitCount)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch products:', error)
    return []
  }

  // Also check for products that might have images in product_images table
  const productIds = data.map(p => p.id)
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('product_id')
    .in('product_id', productIds)

  const productsWithUploadedImages = new Set(existingImages?.map(i => i.product_id) || [])

  // Filter out products that already have uploaded images
  return data.filter(p => !productsWithUploadedImages.has(p.id))
}

/**
 * Update product with image URL
 */
async function updateProductImage(productId, imageUrl, sku, externalId) {
  if (dryRun) {
    return true
  }

  const updateData = {
    external_image_url: imageUrl,
    data_source: 'kicksdb'
  }
  
  if (sku) updateData.sku = sku
  if (externalId) updateData.external_id = externalId

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)

  return !error
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Sneaker Image Populator')
  console.log('=' .repeat(50))
  
  if (dryRun) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n')
  }
  
  if (brandFilter) {
    console.log(`📦 Filtering by brand: ${brandFilter}`)
  }
  
  if (limitCount) {
    console.log(`📦 Processing limit: ${limitCount}`)
  }

  // Get products without images
  console.log('\n📋 Fetching products without images...')
  const products = await getProductsWithoutImages()
  
  console.log(`   Found ${products.length} products needing images\n`)

  if (products.length === 0) {
    console.log('✅ All products have images!')
    return
  }

  // Group by brand for display
  const byBrand = {}
  for (const p of products) {
    if (!byBrand[p.brand]) byBrand[p.brand] = []
    byBrand[p.brand].push(p)
  }

  console.log('📊 Products by brand:')
  for (const [brand, items] of Object.entries(byBrand)) {
    console.log(`   ${brand}: ${items.length}`)
  }
  console.log('')

  // Process each product
  for (const product of products) {
    processed++
    
    // Extract colorway from name if present (e.g., "Air Jordan 1 — Chicago" -> "Air Jordan 1 Chicago")
    const cleanName = product.name.replace(/\s*—\s*/g, ' ').trim()
    
    process.stdout.write(`[${processed}/${products.length}] ${product.brand} ${cleanName}... `)
    
    const { imageUrl, sku, externalId } = await searchKicksDB(product.brand, cleanName)
    
    if (imageUrl) {
      const success = await updateProductImage(product.id, imageUrl, sku, externalId)
      if (success) {
        console.log('✅')
        updated++
      } else {
        console.log('❌ (DB error)')
        failed++
      }
    } else {
      console.log('⚠️ No image found')
      skipped++
    }
    
    // Rate limiting - wait between requests
    await sleep(500) // 500ms between requests
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary')
  console.log('='.repeat(50))
  console.log(`   Processed: ${processed}`)
  console.log(`   Updated:   ${updated}`)
  console.log(`   Skipped:   ${skipped} (no image found)`)
  console.log(`   Failed:    ${failed}`)
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes')
  }
}

main().catch(console.error)
