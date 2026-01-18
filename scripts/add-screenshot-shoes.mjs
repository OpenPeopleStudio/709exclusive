#!/usr/bin/env node
/**
 * Add shoes from screenshot with stock photos
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

// Shoes identified from screenshot (Row by Row, Left to Right)
const shoes = [
  // Row 1
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'White University Gold' },
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'Yellow Ochre' },
  { brand: 'Nike', model: 'Kyrie 7', colorway: 'Chip' },
  { brand: 'Jordan', model: 'Air Jordan 11', colorway: 'Cool Grey' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Oreo' },
  
  // Row 2
  { brand: 'Jordan', model: 'Air Jordan 8', colorway: 'Bugs Bunny' },
  { brand: 'Nike', model: 'Air Fear of God 1', colorway: 'Oatmeal' },
  { brand: 'Jordan', model: 'Air Jordan 12', colorway: 'Playoff' },
  { brand: 'Jordan', model: 'Air Jordan 14', colorway: 'Cool Grey' },
  { brand: 'Jordan', model: 'Air Jordan 6', colorway: 'Cool Grey' },
  
  // Row 3
  { brand: 'Nike', model: 'LeBron 9', colorway: 'Watch the Throne' },
  { brand: 'Jordan', model: 'Air Jordan 13', colorway: 'Neutral Grey' },
  { brand: 'Jordan', model: 'Air Jordan 12', colorway: 'Reverse Flu Game' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Snakeskin Light Bone' },
  { brand: 'Jordan', model: 'Air Jordan 12', colorway: 'White Grey' },
  
  // Row 4
  { brand: 'Nike', model: 'Converse x Comme des Garcons', colorway: 'Low Black' },
  { brand: 'Nike', model: 'Kobe AD NXT', colorway: 'Black' },
  { brand: 'Nike', model: 'Zoom KD 4', colorway: 'Blue' },
  { brand: 'Nike', model: 'Kobe 5 Protro', colorway: 'Lakers' },
  { brand: 'Nike', model: 'LeBron 15', colorway: 'Ashes' },
  
  // Row 5 (empty first cell)
  { brand: 'Nike', model: 'Kyrie 3', colorway: 'White Chrome' },
  { brand: 'Nike', model: 'Kyrie 4', colorway: 'Yellow' },
  { brand: 'New Balance', model: '2002R', colorway: 'Navy' },
  { brand: 'New Balance', model: '990v5', colorway: 'Grey' },
  
  // Row 6
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'MX Carbon' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Beluga' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Black Cement' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Turtle Dove' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Patta Aqua' },
  
  // Row 7
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Concord' },
  { brand: 'Jordan', model: 'Air Jordan 13', colorway: 'Black University Blue' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Concord Bred' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'White Bred' },
  { brand: 'Nike', model: 'Kyrie Low 2', colorway: 'White Red' },
  
  // Row 8
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Denim Obsidian' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Cream White' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Gorge Green' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'White Cement Reimagined' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Obsidian' },
  
  // Row 9
  { brand: 'Nike', model: 'LeBron 18', colorway: 'Gum' },
  { brand: 'Nike', model: 'Air Max Plus', colorway: 'Pink' },
  { brand: 'Nike', model: 'Kyrie 6', colorway: 'Neon Graffiti' },
  { brand: 'Nike', model: 'ZoomX Vaporfly Next%', colorway: 'White' },
  { brand: 'Nike', model: 'Air Max 97', colorway: 'Silver Bullet' }
]

let added = 0
let updated = 0
let failed = 0

function searchSneaks(query) {
  return new Promise((resolve) => {
    sneaks.getProducts(query, 3, (err, products) => {
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

function generateSlug(brand, model, colorway) {
  return `${brand}-${model}-${colorway}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36).slice(-4)
}

async function main() {
  console.log('🔍 Adding shoes from screenshot with stock photos')
  console.log('=' .repeat(60))
  console.log(`   Processing ${shoes.length} shoes\n`)

  for (let i = 0; i < shoes.length; i++) {
    const { brand, model, colorway } = shoes[i]
    const fullName = `${model} — ${colorway}`
    const displayName = `${brand} ${model} ${colorway}`
    
    process.stdout.write(`[${i + 1}/${shoes.length}] ${displayName.substring(0, 45).padEnd(45)}`)

    // Check if already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, external_image_url')
      .eq('brand', brand)
      .or(`name.ilike.%${colorway}%,name.ilike.%${model}%`)
      .limit(1)

    if (existing && existing.length > 0 && existing[0].external_image_url) {
      console.log(' ⏭️ Exists')
      continue
    }

    // Search for image
    const searchQuery = `${brand} ${model} ${colorway}`
    const result = await searchSneaks(searchQuery)

    if (result && result.imageUrl) {
      if (existing && existing.length > 0) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            external_image_url: result.imageUrl,
            sku: result.sku || undefined,
            data_source: 'sneaks-api'
          })
          .eq('id', existing[0].id)

        if (!error) {
          console.log(' ✅ Updated')
          updated++
        } else {
          console.log(' ❌ DB error')
          failed++
        }
      } else {
        // Create new product
        const slug = generateSlug(brand, model, colorway)
        const { error } = await supabase
          .from('products')
          .insert({
            name: fullName,
            brand,
            slug,
            category: 'footwear',
            external_image_url: result.imageUrl,
            sku: result.sku || null,
            colorway,
            data_source: 'sneaks-api'
          })

        if (!error) {
          console.log(' ✅ Added')
          added++
        } else {
          console.log(' ❌ Insert error:', error.message)
          failed++
        }
      }
    } else {
      // Still add the product without an image
      if (!existing || existing.length === 0) {
        const slug = generateSlug(brand, model, colorway)
        const { error } = await supabase
          .from('products')
          .insert({
            name: fullName,
            brand,
            slug,
            category: 'footwear',
            colorway,
            data_source: 'manual'
          })

        if (!error) {
          console.log(' ⚠️ Added (no image)')
          added++
        } else {
          console.log(' ❌')
          failed++
        }
      } else {
        console.log(' ⚠️ No image found')
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results:`)
  console.log(`   Added:   ${added}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed:  ${failed}`)
}

main().catch(console.error)
