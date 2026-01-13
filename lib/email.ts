import { Resend } from 'resend'
import { createSupabaseServer } from './supabaseServer'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderEmailData {
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

async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const supabase = await createSupabaseServer()

  // Get order with customer email
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!inner(email)
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
        condition_code,
        products!inner(name)
      )
    `)
    .eq('order_id', orderId)

  if (!items) return null

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

  return {
    orderId: order.id,
    customerEmail: order.profiles.email,
    items: emailItems,
    subtotal,
    shipping,
    total: subtotal + shipping,
    shippingAddress: order.shipping_address,
    trackingNumber: order.tracking_number,
    carrier: order.carrier
  }
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatAddress(address: OrderEmailData['shippingAddress']): string {
  return `${address.name}
${address.line1}${address.line2 ? `\n${address.line2}` : ''}
${address.city}, ${address.province} ${address.postal_code}
${address.country}`
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) return

    const itemsHtml = data.items.map(item =>
      `<tr>
        <td>${item.sku}</td>
        <td>${item.name}${item.size ? ` (${item.size})` : ''} - ${item.condition}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    ).join('')

    await resend.emails.send({
      from: '709exclusive <orders@709exclusive.com>',
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderId}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order ID: ${data.orderId}</p>

        <h2>Items Ordered</h2>
        <table border="1" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h2>Order Summary</h2>
        <p>Subtotal: ${formatCurrency(data.subtotal)}</p>
        <p>Shipping: ${formatCurrency(data.shipping)}</p>
        <p><strong>Total: ${formatCurrency(data.total)}</strong></p>

        <h2>Shipping Address</h2>
        <pre>${formatAddress(data.shippingAddress)}</pre>

        <p>We'll send you another email when your order ships.</p>
        <p>Questions? Contact us at support@709exclusive.com</p>
      `
    })
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
  }
}

export async function sendOrderShipped(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) return

    const trackingInfo = data.trackingNumber && data.carrier
      ? `<p>Tracking: ${data.trackingNumber} (${data.carrier})</p>`
      : ''

    await resend.emails.send({
      from: '709exclusive <orders@709exclusive.com>',
      to: data.customerEmail,
      subject: `Your order has shipped - ${data.orderId}`,
      html: `
        <h1>Your order has shipped!</h1>
        <p>Order ID: ${data.orderId}</p>

        ${trackingInfo}

        <h2>Shipping Address</h2>
        <pre>${formatAddress(data.shippingAddress)}</pre>

        <p>Questions? Contact us at support@709exclusive.com</p>
      `
    })
  } catch (error) {
    console.error('Failed to send shipping confirmation:', error)
  }
}

export async function sendOrderCancelled(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) return

    await resend.emails.send({
      from: '709exclusive <orders@709exclusive.com>',
      to: data.customerEmail,
      subject: `Order Cancelled - ${data.orderId}`,
      html: `
        <h1>Order Cancelled</h1>
        <p>We're sorry, but your order ${data.orderId} has been cancelled.</p>
        <p>If you were charged, your payment will be refunded within 5-7 business days.</p>
        <p>Questions? Contact us at support@709exclusive.com</p>
      `
    })
  } catch (error) {
    console.error('Failed to send cancellation email:', error)
  }
}

export async function sendOrderRefunded(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) return

    await resend.emails.send({
      from: '709exclusive <orders@709exclusive.com>',
      to: data.customerEmail,
      subject: `Refund Processed - ${data.orderId}`,
      html: `
        <h1>Refund Processed</h1>
        <p>Your refund for order ${data.orderId} has been processed.</p>
        <p>Amount: ${formatCurrency(data.total)}</p>
        <p>Please allow 5-7 business days for the refund to appear on your account.</p>
        <p>Questions? Contact us at support@709exclusive.com</p>
      `
    })
  } catch (error) {
    console.error('Failed to send refund email:', error)
  }
}

export async function sendAdminOrderNotification(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) return

    await resend.emails.send({
      from: '709exclusive <system@709exclusive.com>',
      to: 'admin@709exclusive.com', // Configure admin email
      subject: `New Order Received - ${data.orderId}`,
      html: `
        <h1>New Order Received</h1>
        <p>Order ID: ${data.orderId}</p>
        <p>Customer: ${data.customerEmail}</p>
        <p>Total: ${formatCurrency(data.total)}</p>

        <h2>Items</h2>
        <ul>
          ${data.items.map(item => `<li>${item.sku} - ${item.name} (x${item.quantity})</li>`).join('')}
        </ul>
      `
    })
  } catch (error) {
    console.error('Failed to send admin notification:', error)
  }
}