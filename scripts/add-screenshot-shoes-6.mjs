#!/usr/bin/env node
/**
 * Add shoes from screenshot 6 - Final batch
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

// Shoes from screenshot 6 - Final batch
const shoes = [
  // Row 1
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Game Royal White' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Black White' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Royal Blue' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Black Gym Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Camo Olive' },
  
  // Row 2
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Pine Green' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Lucky Green' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Black Red White' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'UNC Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Setsubun Gold' },
  
  // Row 3
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Green Toe' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Navy Blue' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Gym Red Black' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Olive Gold' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Iron Purple' },
  
  // Row 4
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Hearts' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Black Chrome' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Ghost Volt' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Volt Black' },
  { brand: 'Nike', model: 'Dunk High', colorway: 'Bred Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Cement Grey' },
  
  // Row 5
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Desert Sand' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Green Apple' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Royal Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Panda White Black' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Strawberry' },
  
  // Row 6
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Metallic Gold' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Yellow Ochre' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Blue Marina' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Baby Blue' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Black Safari' },
  
  // Row 7
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Black Gold' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Multicolor Paint' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Ice White' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'White' },
  { brand: 'Nike', model: 'SB Dunk Low', colorway: 'Safari' },
  
  // Row 8
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Chicago Split' },
  { brand: 'New Balance', model: '550', colorway: 'White Grey' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Valentine Red' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Wolf Grey' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'White Grey' },
  
  // Row 9
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Escape Treeline' },
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'Linen Khaki' }
]

let added = 0, updated = 0, skipped = 0, failed = 0

function searchSneaks(query) {
  return new Promise((resolve) => {
    sneaks.getProducts(query, 3, (err, products) => {
      if (err || !products || products.length === 0) { resolve(null); return }
      const match = products.find(p => p.thumbnail) || products[0]
      resolve({ imageUrl: match.thumbnail || null, sku: match.styleID || null })
    })
  })
}

function generateSlug(brand, model, colorway) {
  return `${brand}-${model}-${colorway}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4)
}

async function main() {
  console.log('🔍 Adding shoes from screenshot 6 (FINAL)')
  console.log('='.repeat(60))
  console.log(`   Processing ${shoes.length} shoes\n`)

  for (let i = 0; i < shoes.length; i++) {
    const { brand, model, colorway } = shoes[i]
    const fullName = `${model} — ${colorway}`
    process.stdout.write(`[${i + 1}/${shoes.length}] ${brand} ${model} ${colorway}`.substring(0, 55).padEnd(55))

    const { data: existing } = await supabase.from('products').select('id, external_image_url').eq('brand', brand).ilike('name', `%${colorway}%`).limit(1)

    if (existing?.length > 0 && existing[0].external_image_url) { console.log(' ⏭️'); skipped++; continue }

    const result = await searchSneaks(`${brand} ${model} ${colorway}`)

    if (result?.imageUrl) {
      if (existing?.length > 0) {
        await supabase.from('products').update({ external_image_url: result.imageUrl, sku: result.sku, data_source: 'sneaks-api' }).eq('id', existing[0].id)
        console.log(' ✅ Upd'); updated++
      } else {
        const { error } = await supabase.from('products').insert({ name: fullName, brand, slug: generateSlug(brand, model, colorway), category: 'footwear', external_image_url: result.imageUrl, sku: result.sku, colorway, data_source: 'sneaks-api' })
        console.log(error ? ' ❌' : ' ✅'); error ? failed++ : added++
      }
    } else {
      if (!existing?.length) {
        await supabase.from('products').insert({ name: fullName, brand, slug: generateSlug(brand, model, colorway), category: 'footwear', colorway, data_source: 'manual' })
        console.log(' ⚠️'); added++
      } else { console.log(' ⚠️') }
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Added: ${added} | Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`)
}

main().catch(console.error)
