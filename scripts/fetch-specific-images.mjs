#!/usr/bin/env node
/**
 * Fetch images for specific products using KicksDB API
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const kicksdbApiKey = process.env.KICKSDB_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!kicksdbApiKey) {
  console.error('❌ Missing KICKSDB_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Products to find images for
const products = [
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'White / University Gold' },
  { brand: 'Nike', model: 'Kyrie 7', colorway: 'Play for the Future' },
  { brand: 'Nike', model: 'Kobe 5 Protro', colorway: 'Bruce Lee' },
  { brand: 'Nike', model: 'Kobe AD NXT 360', colorway: 'White / Metallic Gold' },
  { brand: 'Nike', model: 'LeBron Soldier 14', colorway: 'Blue Void / Green Strike' },
  { brand: 'Nike', model: 'LeBron 8', colorway: 'Lakers' },
  { brand: 'Nike', model: 'LeBron 15', colorway: 'Ashes' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Patta Aqua Noise' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Denim / Obsidian' },
  { brand: 'Nike', model: 'Air Max 90', colorway: 'Infrared Black' },
  { brand: 'Nike', model: 'Air Max 95', colorway: 'Neon' },
  { brand: 'Nike', model: 'Air Max 97', colorway: 'Pink Fade' },
  { brand: 'Jordan', model: 'Air Jordan 11 Retro', colorway: 'Legend Blue' },
  { brand: 'Jordan', model: 'Air Jordan 10 Retro', colorway: 'Seattle' },
  { brand: 'Jordan', model: 'Air Jordan 8 Retro', colorway: 'Aqua' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Bred' },
  { brand: 'Jordan', model: 'Air Jordan 14 Retro', colorway: 'Cool Grey' },
  { brand: 'Jordan', model: 'Air Jordan 6 Retro', colorway: 'White / Black' },
  { brand: 'Jordan', model: 'Air Jordan 3 Retro', colorway: 'Animal Instinct' },
  { brand: 'Jordan', model: 'Air Jordan 13 Retro', colorway: 'He Got Game' },
  { brand: 'Jordan', model: 'Air Jordan 12 Retro', colorway: 'Reverse Flu Game' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Snakeskin Light Bone' },
  { brand: 'Jordan', model: 'Air Jordan 8 Retro', colorway: 'White / Chrome' },
  { brand: 'Jordan', model: 'Air Jordan 13 Retro', colorway: 'Black / University Blue' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Concord' },
  { brand: 'Jordan', model: 'Air Jordan 2 Retro', colorway: 'Chicago' },
  { brand: 'Jordan', model: 'Air Jordan 12 Retro', colorway: 'Deep Royal Blue' },
  { brand: 'Jordan', model: 'Air Jordan 3 Retro', colorway: 'Black Cement' },
  { brand: 'Jordan', model: 'Air Jordan 3 Retro', colorway: 'True Blue' },
  { brand: 'Yeezy', model: '450', colorway: 'Cloud White' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'MX Carbon' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Beluga Reflective' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Zyon' },
  { brand: 'Yeezy', model: 'Boost 380', colorway: 'Covellite' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Triple White' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'Ochre' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'Onyx' },
  { brand: 'New Balance', model: '990v5', colorway: 'Navy' },
  { brand: 'Converse', model: 'Chuck 70 Low', colorway: 'Comme des Garçons PLAY Black / Red Heart' }
]

let updated = 0
let failed = 0

async function searchKicksDB(query) {
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
        console.log('   ⏳ Rate limited, waiting 60s...')
        await new Promise(r => setTimeout(r, 60000))
        return searchKicksDB(query)
      }
      return null
    }

    const data = await response.json()
    if (data.products && data.products.length > 0) {
      const match = data.products[0]
      return {
        imageUrl: match.image?.original || match.image?.small || null,
        sku: match.sku || null,
        externalId: match.id || null
      }
    }
    return null
  } catch (error) {
    console.error(`   Error: ${error.message}`)
    return null
  }
}

async function findProductInDB(brand, model, colorway) {
  // Try to find the product by name pattern
  const fullName = `${model} — ${colorway}`
  
  const { data } = await supabase
    .from('products')
    .select('id, name, brand, external_image_url')
    .eq('brand', brand)
    .or(`name.ilike.%${colorway}%,name.ilike.%${model}%`)
    .limit(5)

  // Find best match
  if (data && data.length > 0) {
    // Prefer exact match
    const exactMatch = data.find(p => 
      p.name.includes(colorway) || p.name.includes(fullName)
    )
    return exactMatch || data[0]
  }
  
  return null
}

async function main() {
  console.log('🔍 Fetching stock photos for specific products')
  console.log('=' .repeat(60))
  console.log(`   Processing ${products.length} products\n`)

  for (let i = 0; i < products.length; i++) {
    const { brand, model, colorway } = products[i]
    const displayName = `${brand} ${model} ${colorway}`
    
    process.stdout.write(`[${i + 1}/${products.length}] ${displayName.substring(0, 50).padEnd(50)}`)

    // Search KicksDB
    const searchQuery = `${brand} ${model} ${colorway}`
    const result = await searchKicksDB(searchQuery)

    if (result && result.imageUrl) {
      // Find product in database
      const product = await findProductInDB(brand, model, colorway)
      
      if (product) {
        // Update the product
        const { error } = await supabase
          .from('products')
          .update({
            external_image_url: result.imageUrl,
            sku: result.sku || product.sku,
            external_id: result.externalId,
            data_source: 'kicksdb'
          })
          .eq('id', product.id)

        if (!error) {
          console.log(' ✅')
          updated++
        } else {
          console.log(' ❌ DB error')
          failed++
        }
      } else {
        // Product not in DB yet - just log the image URL
        console.log(' ⚠️ Not in DB')
        console.log(`      Image: ${result.imageUrl.substring(0, 60)}...`)
      }
    } else {
      console.log(' ❌ No image found')
      failed++
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 400))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results: ${updated} updated, ${failed} failed/not found`)
}

main().catch(console.error)
