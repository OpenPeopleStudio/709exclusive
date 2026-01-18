#!/usr/bin/env node
/**
 * Add shoes from screenshot 5 - Jordan 1s
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

// Shoes from screenshot 5 - Jordan 1s
const shoes = [
  // Row 1
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Union Black Toe' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Lilac Bloom' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Lakers Yellow Purple' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Lakers' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Fragment Design' },
  
  // Row 2
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Ice Blue' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Bred Toe' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Seafoam' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Court Purple' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Yellow Toe' },
  
  // Row 3
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'UNC' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Game Royal' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Chicago' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Banned' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Yellow Black' },
  
  // Row 4
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Aluminum' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Royal Blue' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Arctic Pink' },
  { brand: 'Nike', model: 'Air Force 1', colorway: 'Neon Green' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Panda' },
  
  // Row 5
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Dark Mocha' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Hyper Royal' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Denim Sashiko' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Denim Turquoise' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Rose Whisper' },
  
  // Row 6
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Obsidian UNC' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Wolf Grey' },
  { brand: 'Nike', model: 'Dunk High', colorway: 'Pink Prime' },
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Bred Banned' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Ice Blue White' },
  
  // Row 7
  { brand: 'Jordan', model: 'Air Jordan 1 High', colorway: 'Turbo Green' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Paris' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink Orange' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Chinese New Year' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Off White Sail' },
  
  // Row 8
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Kaws Black' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Mocha' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Multi Color' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Pink White' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Craft Olive' },
  
  // Row 9
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Black Canvas' },
  { brand: 'Jordan', model: 'Air Jordan 1 Mid', colorway: 'Barely Orange' },
  { brand: 'Jordan', model: 'Air Jordan 1 Low', colorway: 'Concord' },
  { brand: 'Nike', model: 'Dunk Low', colorway: 'Setsubun' },
  { brand: 'Jordan', model: 'Air Jordan 4', colorway: 'Infrared' }
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
  console.log('🔍 Adding Jordan 1s from screenshot 5')
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
