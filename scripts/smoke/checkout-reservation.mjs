import { createClient } from '@supabase/supabase-js'

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

if (process.env.SMOKE_TEST_CONFIRM !== 'YES') {
  console.error('Set SMOKE_TEST_CONFIRM=YES to run this script.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const now = Date.now()
const brand = 'SMOKE'
const model = `Smoke Test ${now}`
const slug = `smoke-test-${now}`

let productId
let variantId

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const run = async () => {
  console.log('Creating product...')
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: model,
      slug,
      brand,
      category: 'smoke',
      description: 'Smoke test product',
    })
    .select('id')
    .single()

  if (productError) throw productError
  productId = product.id

  console.log('Creating variant...')
  const { data: createdVariant, error: variantError } = await supabase.rpc('create_variant_with_sku', {
    product_id_input: productId,
    brand_input: brand,
    model_input: model,
    size_input: '9',
    condition_input: 'DS',
    price_input: 10000,
    stock_input: 2,
  })

  if (variantError) throw variantError
  variantId = createdVariant

  console.log('Reserving inventory (qty 1)...')
  const { error: reserveError } = await supabase.rpc('reserve_inventory', {
    variant_id_input: variantId,
    qty_input: 1,
  })
  if (reserveError) throw reserveError

  const { data: afterReserve, error: reserveReadError } = await supabase
    .from('product_variants')
    .select('stock, reserved')
    .eq('id', variantId)
    .single()
  if (reserveReadError) throw reserveReadError

  assert(afterReserve.reserved === 1, 'Expected reserved to be 1 after reserve')
  assert(afterReserve.stock === 2, 'Expected stock to remain 2 after reserve')

  console.log('Finalizing inventory (qty 1)...')
  const { error: finalizeError } = await supabase.rpc('finalize_inventory', {
    variant_id_input: variantId,
    qty_input: 1,
  })
  if (finalizeError) throw finalizeError

  const { data: afterFinalize, error: finalizeReadError } = await supabase
    .from('product_variants')
    .select('stock, reserved')
    .eq('id', variantId)
    .single()
  if (finalizeReadError) throw finalizeReadError

  assert(afterFinalize.reserved === 0, 'Expected reserved to be 0 after finalize')
  assert(afterFinalize.stock === 1, 'Expected stock to be 1 after finalize')

  console.log('Smoke test passed.')
}

try {
  await run()
} catch (error) {
  console.error('Smoke test failed:', error)
  process.exitCode = 1
} finally {
  if (productId) {
    console.log('Cleaning up...')
    await supabase.from('products').delete().eq('id', productId)
  }
}
