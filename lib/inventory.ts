import { createSupabaseServer } from './supabaseServer'

export interface VariantAvailability {
  id: string
  stock: number
  reserved: number
  available: number
}

// Get availability for multiple variants
export async function getVariantAvailability(variantIds: string[]): Promise<VariantAvailability[]> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('variant_availability')
    .select('*')
    .in('id', variantIds)

  if (error) {
    throw error
  }

  return data || []
}

// Get single variant availability
export async function getVariantAvailabilityById(variantId: string): Promise<VariantAvailability | null> {
  const results = await getVariantAvailability([variantId])
  return results[0] || null
}

// Admin function to release reserved inventory
export async function releaseReservedInventory(variantId: string, qty: number): Promise<void> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.rpc('release_reserved_inventory_admin', {
    variant_id_input: variantId,
    qty_to_release: qty
  })

  if (error) {
    throw error
  }
}

// Admin function to adjust stock (audited)
// Only stock adjustments are allowed - reserved is managed by checkout system
export async function adjustInventory(
  variantId: string,
  stockChange: number,
  reason: string,
  adminId: string
): Promise<void> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.rpc('admin_adjust_inventory', {
    variant_id_input: variantId,
    delta_input: stockChange,
    reason_input: reason,
    actor_input: adminId
  })

  if (error) {
    throw error
  }
}

// Get inventory audit history
export async function getInventoryAuditHistory(variantId?: string): Promise<any[]> {
  const supabase = await createSupabaseServer()

  let query = supabase
    .from('inventory_audit')
    .select(`
      *,
      product_variants!inner(sku)
    `)
    .order('created_at', { ascending: false })

  if (variantId) {
    query = query.eq('variant_id', variantId)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    throw error
  }

  return data || []
}