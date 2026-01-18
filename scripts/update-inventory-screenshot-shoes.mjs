#!/usr/bin/env node
/**
 * Update inventory for screenshot shoes:
 * - Set inventory to 3 with random size 9-13 for all screenshot shoes
 * - Set inventory to 0 for all other shoes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// All shoes from the 6 screenshots - using search terms to match
const screenshotShoes = [
  // Screenshot 1
  { brand: 'Nike', search: 'Air Force 1 Low White' },
  { brand: 'Nike', search: 'Air Force 1 Low Black' },
  { brand: 'Nike', search: 'Air Force 1 Mid White' },
  { brand: 'Nike', search: 'Air Max 90 White' },
  { brand: 'Nike', search: 'Air Max 97 Silver Bullet' },
  { brand: 'Nike', search: 'Dunk Low Panda' },
  { brand: 'Nike', search: 'Dunk Low Grey Fog' },
  { brand: 'Nike', search: 'Dunk Low Championship Red' },
  { brand: 'Nike', search: 'Dunk Low Syracuse' },
  { brand: 'Nike', search: 'Dunk Low UCLA' },
  { brand: 'Nike', search: 'Dunk Low Kentucky' },
  { brand: 'Nike', search: 'Dunk Low Michigan' },
  { brand: 'Nike', search: 'Dunk Low Valerian Blue' },
  { brand: 'Nike', search: 'Dunk Low Rose Whisper' },
  { brand: 'Nike', search: 'Dunk Low Green Glow' },
  { brand: 'Nike', search: 'Dunk High Panda' },
  { brand: 'Nike', search: 'SB Dunk Low Travis Scott' },
  { brand: 'Nike', search: 'SB Dunk Low Strangelove' },
  { brand: 'Nike', search: 'SB Dunk Low Chicago' },
  { brand: 'Nike', search: 'SB Dunk Low Safari' },
  { brand: 'Jordan', search: 'Jordan 1 High Chicago' },
  { brand: 'Jordan', search: 'Jordan 1 High Bred' },
  { brand: 'Jordan', search: 'Jordan 1 High Royal' },
  { brand: 'Jordan', search: 'Jordan 1 High Shadow' },
  { brand: 'Jordan', search: 'Jordan 1 High Pine Green' },
  { brand: 'Jordan', search: 'Jordan 1 High Court Purple' },
  { brand: 'Jordan', search: 'Jordan 1 High University Blue' },
  { brand: 'Jordan', search: 'Jordan 1 High Dark Mocha' },
  { brand: 'Jordan', search: 'Jordan 1 High Travis Scott' },
  { brand: 'Jordan', search: 'Jordan 1 High Off-White UNC' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Chicago' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Banned' },
  { brand: 'Jordan', search: 'Jordan 1 Low Travis Scott Reverse Mocha' },
  { brand: 'Jordan', search: 'Jordan 4 White Cement' },
  { brand: 'Jordan', search: 'Jordan 4 Bred' },
  { brand: 'Jordan', search: 'Jordan 4 Fire Red' },
  { brand: 'Jordan', search: 'Jordan 11 Concord' },
  { brand: 'Jordan', search: 'Jordan 11 Bred' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Zebra' },

  // Screenshot 2
  { brand: 'Nike', search: 'Air Force 1 Low University Gold' },
  { brand: 'Nike', search: 'Kyrie 7 Play for the Future' },
  { brand: 'Nike', search: 'Kobe 5 Protro Bruce Lee' },
  { brand: 'Nike', search: 'Kobe AD NXT 360' },
  { brand: 'Nike', search: 'LeBron Soldier 14' },
  { brand: 'Nike', search: 'LeBron 8 Lakers' },
  { brand: 'Nike', search: 'LeBron 15 Ashes' },
  { brand: 'Nike', search: 'Air Max 1 Patta Aqua' },
  { brand: 'Nike', search: 'Air Max 1 Denim' },
  { brand: 'Nike', search: 'Air Max 90 Infrared' },
  { brand: 'Nike', search: 'Air Max 95 Neon' },
  { brand: 'Nike', search: 'Air Max 97 Pink Fade' },
  { brand: 'Jordan', search: 'Jordan 11 Legend Blue' },
  { brand: 'Jordan', search: 'Jordan 10 Seattle' },
  { brand: 'Jordan', search: 'Jordan 8 Aqua' },
  { brand: 'Jordan', search: 'Jordan 11 Low Bred' },
  { brand: 'Jordan', search: 'Jordan 14 Cool Grey' },
  { brand: 'Jordan', search: 'Jordan 6 White Black' },
  { brand: 'Jordan', search: 'Jordan 3 Animal Instinct' },
  { brand: 'Jordan', search: 'Jordan 13 He Got Game' },
  { brand: 'Jordan', search: 'Jordan 12 Reverse Flu Game' },
  { brand: 'Jordan', search: 'Jordan 11 Low Snakeskin' },
  { brand: 'Jordan', search: 'Jordan 8 White Chrome' },
  { brand: 'Jordan', search: 'Jordan 13 University Blue' },
  { brand: 'Jordan', search: 'Jordan 11 Low Concord' },
  { brand: 'Jordan', search: 'Jordan 2 Chicago' },
  { brand: 'Jordan', search: 'Jordan 12 Deep Royal' },
  { brand: 'Jordan', search: 'Jordan 3 Black Cement' },
  { brand: 'Jordan', search: 'Jordan 3 True Blue' },
  { brand: 'Yeezy', search: '450 Cloud White' },
  { brand: 'Yeezy', search: 'Foam Runner MX Carbon' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Beluga' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Zyon' },
  { brand: 'Yeezy', search: 'Boost 380 Covellite' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Triple White' },
  { brand: 'Yeezy', search: 'Foam Runner Ochre' },
  { brand: 'Yeezy', search: 'Foam Runner Onyx' },
  { brand: 'New Balance', search: '990v5 Navy' },
  { brand: 'Converse', search: 'Chuck 70' },

  // Screenshot 3
  { brand: 'Nike', search: 'SB Dunk Low What The Paul' },
  { brand: 'Nike', search: 'SB Dunk Low Grateful Dead Green' },
  { brand: 'Nike', search: 'SB Dunk Low Grateful Dead Yellow' },
  { brand: 'Nike', search: 'SB Dunk Low Grateful Dead Orange' },
  { brand: 'Nike', search: 'SB Dunk Low Ben & Jerry' },
  { brand: 'Nike', search: 'SB Dunk Low Chunky Dunky' },
  { brand: 'Nike', search: 'SB Dunk Low Panda Pigeon' },
  { brand: 'Nike', search: 'SB Dunk Low Staple' },
  { brand: 'Nike', search: 'SB Dunk Low Tiffany' },
  { brand: 'Nike', search: 'SB Dunk Low Diamond' },
  { brand: 'Nike', search: 'SB Dunk Low Purple Lobster' },
  { brand: 'Nike', search: 'SB Dunk Low Orange Lobster' },
  { brand: 'Nike', search: 'Dunk Low Off-White Lot 50' },
  { brand: 'Nike', search: 'Dunk Low Off-White Pine Green' },
  { brand: 'Nike', search: 'Dunk Low Union Pistachio' },
  { brand: 'Nike', search: 'Air Max 1 Travis Scott Baroque' },
  { brand: 'Nike', search: 'Air Max 1 Travis Scott Saturn' },
  { brand: 'Nike', search: 'Air Max 1 Patta Monarch' },
  { brand: 'Nike', search: 'Air Max 1 Patta Waves' },
  { brand: 'Nike', search: 'Air Max 90 Off-White Desert Ore' },
  { brand: 'Nike', search: 'Air Max 90 Bacon' },
  { brand: 'Nike', search: 'Air Max 95 Greedy' },
  { brand: 'Nike', search: 'Air Max 97 Sean Wotherspoon' },
  { brand: 'Jordan', search: 'Jordan 1 Low Travis Scott' },
  { brand: 'Jordan', search: 'Jordan 1 Low Fragment' },
  { brand: 'Jordan', search: 'Jordan 1 High Trophy Room' },
  { brand: 'Jordan', search: 'Jordan 1 High Dior' },
  { brand: 'Jordan', search: 'Jordan 1 High Union Storm Blue' },
  { brand: 'Jordan', search: 'Jordan 1 High Union Black Toe' },
  { brand: 'Jordan', search: 'Jordan 3 A Ma Maniére' },
  { brand: 'Jordan', search: 'Jordan 4 Off-White Sail' },
  { brand: 'Jordan', search: 'Jordan 4 Travis Scott Purple' },
  { brand: 'Jordan', search: 'Jordan 4 Union Guava' },
  { brand: 'Jordan', search: 'Jordan 4 Kaws Grey' },
  { brand: 'Jordan', search: 'Jordan 5 Off-White Sail' },
  { brand: 'Jordan', search: 'Jordan 5 Travis Scott' },
  { brand: 'Jordan', search: 'Jordan 6 Travis Scott' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Black Red' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Cream' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Blue Tint' },
  { brand: 'Yeezy', search: 'Boost 350 V2 Semi Frozen' },
  { brand: 'Yeezy', search: 'Boost 700 Wave Runner' },
  { brand: 'Yeezy', search: 'Boost 700 Inertia' },
  { brand: 'Yeezy', search: 'Boost 700 V3 Alvah' },
  { brand: 'Yeezy', search: 'Slide Onyx' },
  { brand: 'Yeezy', search: 'Slide Bone' },
  { brand: 'New Balance', search: '550 White Green' },
  { brand: 'New Balance', search: '2002R Protection Pack' },
  { brand: 'New Balance', search: '2002R Rain Cloud' },

  // Screenshot 4
  { brand: 'Nike', search: 'Dunk Low Vintage Navy' },
  { brand: 'Nike', search: 'Dunk Low Dusty Olive' },
  { brand: 'Nike', search: 'Dunk Low Medium Curry' },
  { brand: 'Nike', search: 'Dunk Low Photon Dust' },
  { brand: 'Nike', search: 'Dunk Low Gorge Green' },
  { brand: 'Nike', search: 'Dunk Low Team Green' },
  { brand: 'Nike', search: 'Dunk Low Argon' },
  { brand: 'Nike', search: 'Dunk Low Court Purple' },
  { brand: 'Nike', search: 'Dunk Low Laser Orange' },
  { brand: 'Nike', search: 'Dunk Low Archeo Pink' },
  { brand: 'Nike', search: 'Dunk Low Harvest Moon' },
  { brand: 'Nike', search: 'Dunk Low Next Nature' },
  { brand: 'Nike', search: 'Dunk Low Fossil Rose' },
  { brand: 'Nike', search: 'Dunk Low Ocean' },
  { brand: 'Nike', search: 'Dunk Low Atmosphere Grey' },
  { brand: 'Nike', search: 'Dunk Low Plum' },
  { brand: 'Nike', search: 'Dunk Low Light Bone' },
  { brand: 'Nike', search: 'Dunk Low Sail Orange Pearl' },
  { brand: 'Nike', search: 'Dunk Low Barber Shop' },
  { brand: 'Nike', search: 'Dunk Low Jade Ice' },
  { brand: 'Nike', search: 'Dunk High Varsity Maize' },
  { brand: 'Nike', search: 'Dunk High Game Royal' },
  { brand: 'Nike', search: 'Dunk High Laser Orange' },
  { brand: 'Nike', search: 'Dunk High Spartan Green' },
  { brand: 'Nike', search: 'Dunk High Syracuse' },
  { brand: 'Nike', search: 'Air Force 1 Low Tiffany' },
  { brand: 'Nike', search: 'Air Force 1 Low Stussy' },
  { brand: 'Nike', search: 'Air Force 1 Low Travis Scott Sail' },
  { brand: 'Nike', search: 'Air Force 1 Low Off-White Volt' },
  { brand: 'Nike', search: 'Air Force 1 Low Off-White MCA' },
  { brand: 'Jordan', search: 'Jordan 1 High Metallic Gold' },
  { brand: 'Jordan', search: 'Jordan 1 High Seafoam' },
  { brand: 'Jordan', search: 'Jordan 1 High Twist' },
  { brand: 'Jordan', search: 'Jordan 1 High Yellow Ochre' },
  { brand: 'Jordan', search: 'Jordan 1 Mid SE Turf Orange' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Diamond' },
  { brand: 'Jordan', search: 'Jordan 1 Low Wolf Grey' },
  { brand: 'Jordan', search: 'Jordan 1 Low Neutral Grey' },
  { brand: 'Jordan', search: 'Jordan 1 Low Gym Red' },
  { brand: 'New Balance', search: '550 White Grey' },
  { brand: 'New Balance', search: '550 Sea Salt' },
  { brand: 'New Balance', search: '992 Grey' },
  { brand: 'New Balance', search: '990v3 Grey' },
  { brand: 'Asics', search: 'Gel-Kayano 14' },
  { brand: 'Asics', search: 'Gel-1130' },

  // Screenshot 5
  { brand: 'Nike', search: 'Dunk Low Lilac Bloom' },
  { brand: 'Jordan', search: 'Jordan 1 High Lakers' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Lakers' },
  { brand: 'Jordan', search: 'Jordan 1 Low Fragment' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Ice Blue' },
  { brand: 'Jordan', search: 'Jordan 1 High Bred Toe' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Yellow Toe' },
  { brand: 'Jordan', search: 'Jordan 1 Low UNC' },
  { brand: 'Jordan', search: 'Jordan 1 High Game Royal' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Yellow Black' },
  { brand: 'Jordan', search: 'Jordan 1 Low Aluminum' },
  { brand: 'Jordan', search: 'Jordan 1 Low Royal Blue' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Arctic Pink' },
  { brand: 'Nike', search: 'Air Force 1 Neon Green' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Panda' },
  { brand: 'Jordan', search: 'Jordan 3 Dark Mocha' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Hyper Royal' },
  { brand: 'Nike', search: 'Dunk Low Denim Sashiko' },
  { brand: 'Nike', search: 'Dunk Low Denim Turquoise' },
  { brand: 'Jordan', search: 'Jordan 1 High Obsidian' },
  { brand: 'Nike', search: 'Dunk High Pink Prime' },
  { brand: 'Jordan', search: 'Jordan 1 High Bred Banned' },
  { brand: 'Jordan', search: 'Jordan 1 Low Ice Blue' },
  { brand: 'Jordan', search: 'Jordan 1 High Turbo Green' },
  { brand: 'Jordan', search: 'Jordan 1 Low Paris' },
  { brand: 'Nike', search: 'Dunk Low Pink Orange' },
  { brand: 'Jordan', search: 'Jordan 1 Low Chinese New Year' },
  { brand: 'Jordan', search: 'Jordan 4 Kaws Black' },
  { brand: 'Jordan', search: 'Jordan 1 Low Mocha' },
  { brand: 'Nike', search: 'Dunk Low Multi Color' },
  { brand: 'Nike', search: 'Dunk Low Pink White' },
  { brand: 'Jordan', search: 'Jordan 4 Craft Olive' },
  { brand: 'Jordan', search: 'Jordan 4 Black Canvas' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Barely Orange' },
  { brand: 'Jordan', search: 'Jordan 1 Low Concord' },
  { brand: 'Nike', search: 'Dunk Low Setsubun' },
  { brand: 'Jordan', search: 'Jordan 4 Infrared' },

  // Screenshot 6
  { brand: 'Jordan', search: 'Jordan 1 Low Game Royal' },
  { brand: 'Nike', search: 'Dunk Low Black White' },
  { brand: 'Jordan', search: 'Jordan 1 High Black Gym Red' },
  { brand: 'Nike', search: 'Dunk Low Camo Olive' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Lucky Green' },
  { brand: 'Jordan', search: 'Jordan 1 High Black Red White' },
  { brand: 'Jordan', search: 'Jordan 1 Low UNC Blue' },
  { brand: 'Nike', search: 'Dunk Low Setsubun Gold' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Green Toe' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Navy Blue' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Gym Red Black' },
  { brand: 'Nike', search: 'Dunk Low Olive Gold' },
  { brand: 'Nike', search: 'Dunk Low Iron Purple' },
  { brand: 'Nike', search: 'Dunk Low Pink Hearts' },
  { brand: 'Nike', search: 'Dunk Low Black Chrome' },
  { brand: 'Nike', search: 'Dunk Low Ghost Volt' },
  { brand: 'Nike', search: 'Dunk Low Volt Black' },
  { brand: 'Nike', search: 'Dunk High Bred' },
  { brand: 'Nike', search: 'Dunk Low Cement Grey' },
  { brand: 'Nike', search: 'Dunk Low Desert Sand' },
  { brand: 'Nike', search: 'Dunk Low Green Apple' },
  { brand: 'Nike', search: 'SB Dunk Low Royal Blue' },
  { brand: 'Nike', search: 'Dunk Low Pink Strawberry' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Yellow Ochre' },
  { brand: 'Jordan', search: 'Jordan 1 High Blue Marina' },
  { brand: 'Nike', search: 'Dunk Low Baby Blue' },
  { brand: 'Nike', search: 'Dunk Low Black Safari' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Black Gold' },
  { brand: 'Jordan', search: 'Jordan 1 Mid Multicolor' },
  { brand: 'Nike', search: 'Dunk Low Ice White' },
  { brand: 'Nike', search: 'Dunk Low White' },
  { brand: 'Nike', search: 'Dunk Low Chicago Split' },
  { brand: 'New Balance', search: '550' },
  { brand: 'Nike', search: 'Dunk Low Valentine' },
  { brand: 'Nike', search: 'Air Max 1 Escape Treeline' },
  { brand: 'Nike', search: 'Air Force 1 Low Linen Khaki' },
]

// Random size between 9 and 13
function randomSize() {
  const sizes = [9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13]
  return sizes[Math.floor(Math.random() * sizes.length)]
}

// Generate SKU
function generateSKU(brand, model, size) {
  const brandCode = brand.substring(0, 3).toUpperCase()
  const modelCode = model.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${brandCode}-${modelCode}-${size}-DS-${random}`
}

async function main() {
  console.log('🔄 Updating inventory for screenshot shoes...')
  console.log('='.repeat(60))

  // Step 1: Get all products
  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, brand')

  if (fetchError) {
    console.error('❌ Failed to fetch products:', fetchError)
    process.exit(1)
  }

  console.log(`📦 Total products in database: ${allProducts.length}`)

  // Step 2: Find matching products for screenshot shoes
  const matchedIds = new Set()
  
  for (const shoe of screenshotShoes) {
    const searchTerms = shoe.search.toLowerCase().split(' ')
    
    for (const product of allProducts) {
      const productName = product.name.toLowerCase()
      const productBrand = product.brand.toLowerCase()
      const shoeBrand = shoe.brand.toLowerCase()
      
      // Check if brand matches (or is close enough)
      const brandMatch = productBrand.includes(shoeBrand) || shoeBrand.includes(productBrand)
      
      // Check if most search terms are in the product name
      const matchingTerms = searchTerms.filter(term => 
        productName.includes(term) || productBrand.includes(term)
      )
      
      // Consider it a match if brand matches and at least 60% of search terms match
      if (brandMatch && matchingTerms.length >= Math.ceil(searchTerms.length * 0.6)) {
        matchedIds.add(product.id)
      }
    }
  }

  console.log(`✅ Matched ${matchedIds.size} products from screenshots`)
  console.log(`📋 Will set to 0 inventory: ${allProducts.length - matchedIds.size} products`)
  console.log('')

  // Step 3: Delete all existing variants to start fresh
  console.log('🗑️  Clearing existing variants...')
  const { error: deleteError } = await supabase
    .from('product_variants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.log('⚠️  Could not clear variants:', deleteError.message)
  }

  // Step 4: Create new variants
  let updated = 0
  let zeroed = 0
  const batchSize = 50
  const variantsToInsert = []

  for (const product of allProducts) {
    const isScreenshotShoe = matchedIds.has(product.id)
    const size = randomSize()
    
    variantsToInsert.push({
      product_id: product.id,
      sku: generateSKU(product.brand, product.name, size),
      size: size.toString(),
      condition: 'Deadstock',
      condition_code: 'DS',
      price_cents: Math.floor(15000 + Math.random() * 35000), // $150-$500
      stock: isScreenshotShoe ? 3 : 0,
      reserved: 0,
      brand: product.brand,
      model: product.name.split('—')[0]?.trim() || product.name
    })

    if (isScreenshotShoe) {
      updated++
    } else {
      zeroed++
    }
  }

  // Insert in batches
  console.log('📤 Inserting variants...')
  for (let i = 0; i < variantsToInsert.length; i += batchSize) {
    const batch = variantsToInsert.slice(i, i + batchSize)
    const { error: insertError } = await supabase
      .from('product_variants')
      .insert(batch)
    
    if (insertError) {
      console.error(`❌ Batch insert failed at ${i}:`, insertError.message)
    }
    process.stdout.write(`\r   Inserted ${Math.min(i + batchSize, variantsToInsert.length)}/${variantsToInsert.length}`)
  }

  console.log('')
  console.log('')
  console.log('='.repeat(60))
  console.log('📊 INVENTORY UPDATE COMPLETE')
  console.log(`   ✅ ${updated} screenshot shoes set to stock=3 (random size 9-13)`)
  console.log(`   📦 ${zeroed} other shoes set to stock=0 (hidden from shop)`)
  console.log('='.repeat(60))

  // Verify
  const { count: inStock } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .gt('stock', 0)

  const { count: outOfStock } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('stock', 0)

  console.log('')
  console.log('🔍 Verification:')
  console.log(`   In stock (stock > 0): ${inStock}`)
  console.log(`   Out of stock (stock = 0): ${outOfStock}`)
}

main().catch(console.error)
