#!/usr/bin/env node
/**
 * Fetch images for ALL products without images using Sneaks-API
 */

import { createClient } from '@supabase/supabase-js'
import SneaksAPI from 'sneaks-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sneaks = new SneaksAPI()

// Parse args
const args = process.argv.slice(2)
const brandFilter = args.find(a => a.startsWith('--brand='))?.split('=')[1]
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const limit = limitArg ? parseInt(limitArg, 10) : 999

let updated = 0
let failed = 0
let skipped = 0

function searchSneaks(query) {
  return new Promise((resolve) => {
    sneaks.getProducts(query, 5, (err, products) => {
      if (err || !products || products.length === 0) {
        resolve(null)
        return
      }
      
      const match = products.find(p => p.thumbnail) || products[0]
      resolve({
        imageUrl: match.thumbnail || null,
        sku: match.styleID || null,
        name: match.shoeName || null
      })
    })
  })
}

async function getProductsWithoutImages() {
  let query = supabase
    .from('products')
    .select('id, name, brand')
    .is('external_image_url', null)
    .order('brand')
    .limit(limit)
  
  if (brandFilter) {
    query = query.eq('brand', brandFilter)
  }
  
  const { data, error } = await query
  if (error) {
    console.error('DB error:', error)
    return []
  }
  return data || []
}

function extractSearchTerms(name, brand) {
  // Remove brand from name if present
  let cleanName = name.replace(new RegExp(brand, 'gi'), '').trim()
  
  // Remove common separators and clean up
  cleanName = cleanName
    .replace(/\s*—\s*/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // For certain brands, adjust the search
  if (brand === 'Jordan') {
    return cleanName // "Air Jordan 11 Legend Blue"
  }
  if (brand === 'Yeezy') {
    return `Yeezy ${cleanName}` // Add Yeezy back since it's the silhouette name
  }
  
  return `${brand} ${cleanName}`
}

async function main() {
  console.log('🔍 Fetching images for all products without images')
  console.log('=' .repeat(60))
  
  if (brandFilter) console.log(`   Brand filter: ${brandFilter}`)
  if (limitArg) console.log(`   Limit: ${limit}`)
  
  const products = await getProductsWithoutImages()
  console.log(`   Found ${products.length} products needing images\n`)

  if (products.length === 0) {
    console.log('✅ All products have images!')
    return
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const displayName = `${product.brand} - ${product.name}`
    
    process.stdout.write(`[${i + 1}/${products.length}] ${displayName.substring(0, 50).padEnd(50)}`)

    // Build search query
    const searchQuery = extractSearchTerms(product.name, product.brand)
    
    try {
      const result = await searchSneaks(searchQuery)

      if (result && result.imageUrl) {
        const { error } = await supabase
          .from('products')
          .update({
            external_image_url: result.imageUrl,
            sku: result.sku || undefined,
            data_source: 'sneaks-api'
          })
          .eq('id', product.id)

        if (!error) {
          console.log(' ✅')
          updated++
        } else {
          console.log(' ❌ DB')
          failed++
        }
      } else {
        console.log(' ⚠️ None')
        skipped++
      }
    } catch (err) {
      console.log(' ❌ Error')
      failed++
    }

    // Rate limiting - be nice to the API
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped} (no image found)`)
  console.log(`   Failed:  ${failed}`)
}

main().catch(console.error)
