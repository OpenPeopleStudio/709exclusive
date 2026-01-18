#!/usr/bin/env node
/**
 * Fetch images using Sneaks-API (open source sneaker scraper)
 * 
 * This uses the sneaks-api npm package which scrapes data from
 * StockX, GOAT, Flight Club, and Stadium Goods.
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

// Products to find images for
const products = [
  { brand: 'Nike', model: 'Air Force 1 Low', colorway: 'White University Gold' },
  { brand: 'Nike', model: 'Kyrie 7', colorway: 'Play for the Future' },
  { brand: 'Nike', model: 'Kobe 5 Protro', colorway: 'Bruce Lee' },
  { brand: 'Nike', model: 'Kobe AD NXT 360', colorway: 'White Metallic Gold' },
  { brand: 'Nike', model: 'LeBron Soldier 14', colorway: 'Blue Void' },
  { brand: 'Nike', model: 'LeBron 8', colorway: 'Lakers' },
  { brand: 'Nike', model: 'LeBron 15', colorway: 'Ashes' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Patta Aqua' },
  { brand: 'Nike', model: 'Air Max 1', colorway: 'Obsidian' },
  { brand: 'Nike', model: 'Air Max 90', colorway: 'Infrared' },
  { brand: 'Nike', model: 'Air Max 95', colorway: 'Neon' },
  { brand: 'Nike', model: 'Air Max 97', colorway: 'Pink' },
  { brand: 'Jordan', model: 'Air Jordan 11', colorway: 'Legend Blue' },
  { brand: 'Jordan', model: 'Air Jordan 10', colorway: 'Seattle' },
  { brand: 'Jordan', model: 'Air Jordan 8', colorway: 'Aqua' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Bred' },
  { brand: 'Jordan', model: 'Air Jordan 14', colorway: 'Cool Grey' },
  { brand: 'Jordan', model: 'Air Jordan 6', colorway: 'White Black' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Animal Instinct' },
  { brand: 'Jordan', model: 'Air Jordan 13', colorway: 'He Got Game' },
  { brand: 'Jordan', model: 'Air Jordan 12', colorway: 'Reverse Flu Game' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Snakeskin' },
  { brand: 'Jordan', model: 'Air Jordan 8', colorway: 'Chrome' },
  { brand: 'Jordan', model: 'Air Jordan 13', colorway: 'University Blue' },
  { brand: 'Jordan', model: 'Air Jordan 11 Low', colorway: 'Concord' },
  { brand: 'Jordan', model: 'Air Jordan 2', colorway: 'Chicago' },
  { brand: 'Jordan', model: 'Air Jordan 12', colorway: 'Royal Blue' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'Black Cement' },
  { brand: 'Jordan', model: 'Air Jordan 3', colorway: 'True Blue' },
  { brand: 'Yeezy', model: '450', colorway: 'Cloud White' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'Carbon' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Beluga' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Zyon' },
  { brand: 'Yeezy', model: 'Boost 380', colorway: 'Covellite' },
  { brand: 'Yeezy', model: 'Boost 350 V2', colorway: 'Triple White' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'Ochre' },
  { brand: 'Yeezy', model: 'Foam Runner', colorway: 'Onyx' },
  { brand: 'New Balance', model: '990v5', colorway: 'Navy' },
  { brand: 'Converse', model: 'CDG Chuck 70', colorway: 'Black Heart' }
]

let updated = 0
let failed = 0

function searchSneaks(query) {
  return new Promise((resolve) => {
    sneaks.getProducts(query, 3, (err, products) => {
      if (err || !products || products.length === 0) {
        resolve(null)
        return
      }
      
      // Return first result with an image
      const match = products.find(p => p.thumbnail) || products[0]
      resolve({
        imageUrl: match.thumbnail || null,
        sku: match.styleID || null,
        name: match.shoeName || null
      })
    })
  })
}

async function findProductInDB(brand, model, colorway) {
  const { data } = await supabase
    .from('products')
    .select('id, name, brand, external_image_url')
    .eq('brand', brand)
    .or(`name.ilike.%${colorway}%,name.ilike.%${model}%`)
    .limit(5)

  if (data && data.length > 0) {
    const exactMatch = data.find(p => 
      p.name.toLowerCase().includes(colorway.toLowerCase())
    )
    return exactMatch || data[0]
  }
  
  return null
}

async function main() {
  console.log('🔍 Fetching stock photos using Sneaks-API')
  console.log('=' .repeat(60))
  console.log(`   Processing ${products.length} products\n`)

  for (let i = 0; i < products.length; i++) {
    const { brand, model, colorway } = products[i]
    const displayName = `${brand} ${model} ${colorway}`
    
    process.stdout.write(`[${i + 1}/${products.length}] ${displayName.substring(0, 45).padEnd(45)}`)

    // Search using simplified query
    const searchQuery = `${model} ${colorway}`
    const result = await searchSneaks(searchQuery)

    if (result && result.imageUrl) {
      // Find product in database
      const product = await findProductInDB(brand, model, colorway)
      
      if (product) {
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
          console.log(' ❌ DB error')
          failed++
        }
      } else {
        console.log(' ⚠️ Not in DB')
        console.log(`      Found: ${result.name}`)
        console.log(`      Image: ${result.imageUrl}`)
      }
    } else {
      console.log(' ❌ No image')
      failed++
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Results: ${updated} updated, ${failed} failed/not found`)
}

main().catch(console.error)
