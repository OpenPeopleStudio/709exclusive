#!/usr/bin/env node
/**
 * Add shoes from screenshot 4 - Dunks and Jordan 1s
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

// Shoes from screenshot 4 (Row by Row, Left to Right)
const shoes = [
  // Row 1
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Black Gum' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Light Bone Olive' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'White Bronze' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Orange Blaze' },
  { brand: 'Nike', model: 'Dunk High', colorway: 'Panda' },
  
  // Row 2
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Bleached Coral' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'UNLV' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Cacao Wow' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Argon' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Lottery Green' },
  
  // Row 3
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Team Gold' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Championship Red' },
  { brand: 'Nike', model: 'Dunk High', colorway: 'Panda Twist' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Pink Quartz' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Black Metallic Gold' },
  
  // Row 4
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Fragment' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Georgetown' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Travis Scott Reverse Mocha' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Vast Grey' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Off White Lot 50' },
  
  // Row 5
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Orange Ceramic' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Coast Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Worn Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'University Blue' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Patent Black Gold' },
  
  // Row 6
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Louis Vuitton Brown' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Made You Look' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Chicago Split' },
  { brand: 'Nike', model: 'Air Force 1', colorway: 'Cactus Jack' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Off White Lot 3' },
  
  // Row 7
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'UNC Toe' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Prism Pink' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Black Pigeon' },
  { brand: 'Nike', model: 'SB Dunk High', colorway: 'Hawaii' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Triple White' },
  
  // Row 8
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'University Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'University Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Teddy Bear' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Smoke Grey' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Royal Toe' },
  
  // Row 9
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Starry Laces' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Black Panda' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Olive' },
  { brand: 'Nike', model: 'SB Dunk High', colorway: 'Sail' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Pine Green' }
]

let added = 0, updated = 0, skipped = 0, failed = 0

function searchSneaks(query) {
  return new Promise((resolve) => {
    sneaks.getProducts(query, 3, (err, products) => {
      if (err || !products || products.length === 0) {
        resolve(null)
        return
      }
      const match = products.find(p => p.thumbnail) || products[0]
      resolve({ imageUrl: match.thumbnail || null, sku: match.styleID || null })
    })
  })
}

function generateSlug(brand, model, colorway) {
  return `${brand}-${model}-${colorway}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4)
}

async function main() {
  console.log('🔍 Adding shoes from screenshot 4')
  console.log('='.repeat(60))
  console.log(`   Processing ${shoes.length} shoes\n`)

  for (let i = 0; i < shoes.length; i++) {
    const { brand, model, colorway } = shoes[i]
    const fullName = `${model} — ${colorway}`
    process.stdout.write(`[${i + 1}/${shoes.length}] ${brand} ${model} ${colorway}`.substring(0, 55).padEnd(55))

    const { data: existing } = await supabase
      .from('products')
      .select('id, external_image_url')
      .eq('brand', brand)
      .ilike('name', `%${colorway}%`)
      .limit(1)

    if (existing?.length > 0 && existing[0].external_image_url) {
      console.log(' ⏭️')
      skipped++
      continue
    }

    const result = await searchSneaks(`${brand} ${model} ${colorway}`)

    if (result?.imageUrl) {
      if (existing?.length > 0) {
        await supabase.from('products').update({ external_image_url: result.imageUrl, sku: result.sku, data_source: 'sneaks-api' }).eq('id', existing[0].id)
        console.log(' ✅ Upd')
        updated++
      } else {
        const { error } = await supabase.from('products').insert({ name: fullName, brand, slug: generateSlug(brand, model, colorway), category: 'footwear', external_image_url: result.imageUrl, sku: result.sku, colorway, data_source: 'sneaks-api' })
        console.log(error ? ' ❌' : ' ✅')
        error ? failed++ : added++
      }
    } else {
      if (!existing?.length) {
        await supabase.from('products').insert({ name: fullName, brand, slug: generateSlug(brand, model, colorway), category: 'footwear', colorway, data_source: 'manual' })
        console.log(' ⚠️')
        added++
      } else {
        console.log(' ⚠️')
      }
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Added: ${added} | Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`)
}

main().catch(console.error)
