#!/usr/bin/env node
/**
 * Add shoes from screenshot 2 with stock photos
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

// Shoes identified from screenshot 2 (Row by Row, Left to Right)
const shoes = [
  // Row 1
  { brand: 'Yeezy', model: '450', colorway: 'Dark Slate' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Sulfur' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Elephant Print' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Bone' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Black Static' },
  
  // Row 2
  { brand: 'Yeezy', model: '700 V3', colorway: 'Alvah' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Fire Red' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Cool Grey' },
  { brand: 'Jordan', model: 'Air Jordan 5', colorway: 'Burgundy' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'True Blue' },
  
  // Row 3
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'White Oreo' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Black Cat' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Velvet' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Valentine Day' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'UNC' },
  
  // Row 4
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Pine Green' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Cardinal Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Yellow Strike' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'True Blue OG' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Midnight Navy' },
  
  // Row 5
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Red Thunder' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Fire Red' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Military Blue' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Seafoam' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Canyon Purple' },
  
  // Row 6
  { brand: 'Jordan', model: 'Air Jordan 5 Low', colorway: 'Chinese New Year' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Chlorophyll' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Black Cement Reimagined' },
  { brand: 'Jordan', model: 'Air Jordan 5', colorway: 'Sail' },
  { brand: 'Jordan', model: 'Air Jordan 5', colorway: 'Georgetown' },
  
  // Row 7
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Off-White Lot 33' },
  { brand: 'Nike', model: 'Dunk High', colorway: 'Fragment' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Panda' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Medium Curry' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Travis Scott Reverse Mocha' },
  
  // Row 8
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Chunky Dunky' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Safari' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'What The Paul' },
  { brand: 'Yeezy', model: 'Boost 700', colorway: 'Mauve' },
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'Off-White Brooklyn' },
  
  // Row 9
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Grateful Dead Green' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'StrangeLove' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Chlorophyll' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Green Glow' },
  { brand: 'Nike', model: 'Air Presto', colorway: 'Off-White Black' }
]

let added = 0
let updated = 0
let skipped = 0
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
  console.log('🔍 Adding shoes from screenshot 2 with stock photos')
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
      .or(`name.ilike.%${colorway}%,name.ilike.%${model} ${colorway}%`)
      .limit(1)

    if (existing && existing.length > 0 && existing[0].external_image_url) {
      console.log(' ⏭️ Exists')
      skipped++
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
          console.log(' ❌ Insert error')
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
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results:`)
  console.log(`   Added:   ${added}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed:  ${failed}`)
}

main().catch(console.error)
