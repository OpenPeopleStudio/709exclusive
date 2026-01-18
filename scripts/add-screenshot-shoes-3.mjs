#!/usr/bin/env node
/**
 * Add shoes from screenshot 3 - Mostly Dunks
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

// Shoes from screenshot 3 (Row by Row, Left to Right) - Heavy on Dunks
const shoes = [
  // Row 1
  { brand: 'Nike', model: 'Dunk High', colorway: 'Pure Platinum' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Montreal Bagel' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Green White' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Paris' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Orange Lobster' },
  
  // Row 2
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Retro White Black' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Black White Panda' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Triple Pink' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Supreme Stars Black' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Valentine Day 2023' },
  
  // Row 3
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Rose Whisper' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Fossil Rose' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Oxford' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Lilac' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Green Glow' },
  
  // Row 4
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Miami Dolphins' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Civilist' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Syracuse' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Light Bone' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Argon Blue' },
  
  // Row 5
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Panda White Black' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Raygun Tie Dye' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Orange Pearl' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Shimmer' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Supreme Stars Gold' },
  
  // Row 6
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Safari CD2563' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Retro White' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Velvet' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Ben Jerry Chunky Dunky' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Leopard' },
  
  // Row 7
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Supreme Red Bandana' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Kentucky Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Coral Pink' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Gym Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Photon Dust' },
  
  // Row 8
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Wheat Mocha' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'UNC' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Paisley Pink' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Light Violet' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Foam' },
  
  // Row 9
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Noise Aqua' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Night of Mischief' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Grey Fog' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Court Purple' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Barbie Hot Pink' }
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
  console.log('🔍 Adding Dunks from screenshot 3')
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
      .ilike('name', `%${colorway}%`)
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
      if (!existing || existing.length === 0) {
        const slug = generateSlug(brand, model, colorway)
        await supabase
          .from('products')
          .insert({
            name: fullName,
            brand,
            slug,
            category: 'footwear',
            colorway,
            data_source: 'manual'
          })
        console.log(' ⚠️ Added (no img)')
        added++
      } else {
        console.log(' ⚠️ No image')
      }
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results: Added ${added}, Updated ${updated}, Skipped ${skipped}, Failed ${failed}`)
}

main().catch(console.error)
