#!/usr/bin/env node
/**
 * Seed Model Images Script
 * 
 * This script helps populate product_models with images by:
 * 1. Reading your seeded models from the database
 * 2. Allowing you to paste image URLs for each model
 * 3. Importing them into Supabase storage
 * 
 * Usage:
 *   node scripts/seed-model-images.mjs
 * 
 * Or with a CSV file:
 *   node scripts/seed-model-images.mjs --csv images.csv
 * 
 * CSV format:
 *   brand,model,image_url
 *   Nike,Air Force 1 Low,https://example.com/af1.jpg
 */

import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'readline'
import { readFileSync, existsSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nRun with: source .env.local && node scripts/seed-model-images.mjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function downloadAndUploadImage(imageUrl, modelId) {
  try {
    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`)
    }

    const buffer = await response.arrayBuffer()
    
    // Generate filename
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `${modelId}/${fileName}`

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('model-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('model-images')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`)
  }
}

async function importImageForModel(modelId, imageUrl, position = 0) {
  try {
    // Download and upload to storage
    const storedUrl = await downloadAndUploadImage(imageUrl, modelId)

    // Check if model already has images
    const { data: existingImages } = await supabase
      .from('model_images')
      .select('id')
      .eq('model_id', modelId)

    const isPrimary = !existingImages || existingImages.length === 0

    // Insert record
    const { error: insertError } = await supabase
      .from('model_images')
      .insert({
        model_id: modelId,
        source: 'seed-script',
        url: storedUrl,
        is_primary: isPrimary,
        position: position
      })

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    return storedUrl
  } catch (error) {
    throw error
  }
}

async function getModelsWithoutImages() {
  // Get all models
  const { data: models, error } = await supabase
    .from('product_models')
    .select('id, brand, model, slug')
    .order('brand')
    .order('model')

  if (error) {
    console.error('Error fetching models:', error)
    return []
  }

  // Get models that have images
  const { data: modelsWithImages } = await supabase
    .from('model_images')
    .select('model_id')

  const modelIdsWithImages = new Set(modelsWithImages?.map(m => m.model_id) || [])

  // Filter to models without images
  return models.filter(m => !modelIdsWithImages.has(m.id))
}

async function processCSV(csvPath) {
  if (!existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  const content = readFileSync(csvPath, 'utf-8')
  const lines = content.trim().split('\n')
  
  // Skip header
  const dataLines = lines.slice(1)
  
  console.log(`📋 Found ${dataLines.length} entries in CSV\n`)

  let success = 0
  let failed = 0

  for (const line of dataLines) {
    const [brand, model, imageUrl] = line.split(',').map(s => s.trim())
    
    if (!brand || !model || !imageUrl) {
      console.log(`⚠️  Skipping invalid line: ${line}`)
      continue
    }

    // Find the model
    const { data: modelData } = await supabase
      .from('product_models')
      .select('id')
      .eq('brand', brand)
      .eq('model', model)
      .single()

    if (!modelData) {
      console.log(`⚠️  Model not found: ${brand} ${model}`)
      failed++
      continue
    }

    try {
      console.log(`📥 Importing: ${brand} ${model}...`)
      await importImageForModel(modelData.id, imageUrl)
      console.log(`✅ Done: ${brand} ${model}`)
      success++
    } catch (error) {
      console.log(`❌ Failed: ${brand} ${model} - ${error.message}`)
      failed++
    }

    // Small delay
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\n📊 Results: ${success} imported, ${failed} failed`)
}

async function interactiveMode() {
  const models = await getModelsWithoutImages()
  
  console.log(`\n📋 Found ${models.length} models without images\n`)
  
  if (models.length === 0) {
    console.log('All models have images!')
    return
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve))

  console.log('Enter image URL for each model (or press Enter to skip, "q" to quit):\n')

  let imported = 0
  let skipped = 0

  for (const model of models) {
    const answer = await question(`${model.brand} ${model.model}: `)
    
    if (answer.toLowerCase() === 'q') {
      break
    }

    if (!answer.trim()) {
      skipped++
      continue
    }

    try {
      console.log('  Importing...')
      await importImageForModel(model.id, answer.trim())
      console.log('  ✅ Done\n')
      imported++
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`)
    }
  }

  rl.close()
  
  console.log(`\n📊 Results: ${imported} imported, ${skipped} skipped`)
}

// Main
const args = process.argv.slice(2)
const csvIndex = args.indexOf('--csv')

if (csvIndex !== -1 && args[csvIndex + 1]) {
  processCSV(args[csvIndex + 1])
} else {
  console.log('🖼️  Model Image Seeder')
  console.log('====================\n')
  console.log('Options:')
  console.log('  1. Interactive mode (paste URLs one by one)')
  console.log('  2. CSV mode: node scripts/seed-model-images.mjs --csv images.csv')
  console.log('')
  interactiveMode()
}
