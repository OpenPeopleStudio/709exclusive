// Unified email interface with order ID-based wrappers
import { createSupabaseServer } from '../supabaseServer'
import {
  sendOrderConfirmation as sendOrderConfirmationSG,
  sendOrderShipped as sendOrderShippedSG,
  sendOrderCancelled as sendOrderCancelledSG,
  sendOrderRefunded as sendOrderRefundedSG,
  sendAdminOrderNotification
} from './sendgrid'

interface OrderEmailData {
  orderId: string
  customerEmail: string
  items: Array<{
    sku: string
    name: string
    size: string | null
    condition: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    name: string
    line1: string
    line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }
  trackingNumber?: string
  carrier?: string
}

// Fetch order data from database
async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const supabase = await createSupabaseServer()

  // Get order with customer email
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      709_profiles!customer_id(email)
    `)
    .eq('id', orderId)
    .single()

  if (!order) return null

  // Get order items with variant details
  const { data: items } = await supabase
    .from('order_items')
    .select(`
      qty,
      price_cents,
      product_variants!inner(
        sku,
        brand,
        model,
        size,
        condition_code
      )
    `)
    .eq('order_id', orderId)

  if (!items) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailItems = items?.map((item: any) => ({
    sku: item.product_variants.sku,
    name: `${item.product_variants.brand} ${item.product_variants.model}`,
    size: item.product_variants.size,
    condition: item.product_variants.condition_code,
    quantity: item.qty,
    price: item.price_cents
  })) || []

  const subtotal = emailItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = order.shipping_cents

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerEmail = (order as any)['709_profiles']?.email || ''

  return {
    orderId: order.id,
    customerEmail,
    items: emailItems,
    subtotal,
    shipping,
    total: subtotal + shipping,
    shippingAddress: order.shipping_address,
    trackingNumber: order.tracking_number,
    carrier: order.carrier
  }
}

// Wrapper functions that accept orderId
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    await sendOrderConfirmationSG(data)
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
  }
}

export async function sendOrderShipped(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    await sendOrderShippedSG(data)
  } catch (error) {
    console.error('Failed to send shipping notification:', error)
  }
}

export async function sendOrderCancelled(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    await sendOrderCancelledSG(data)
  } catch (error) {
    console.error('Failed to send cancellation email:', error)
  }
}

export async function sendOrderRefunded(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    await sendOrderRefundedSG(data)
  } catch (error) {
    console.error('Failed to send refund email:', error)
  }
}

export { sendAdminOrderNotification }
