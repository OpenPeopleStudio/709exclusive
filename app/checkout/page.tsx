'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { CartItemWithVariant } from '@/lib/cart'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setIsProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          Card Information
        </label>
        <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#F2F2F2',
                  '::placeholder': {
                    color: '#7A7A7A',
                  },
                  iconColor: '#B5B5B5',
                },
                invalid: {
                  color: '#EF4444',
                  iconColor: '#EF4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full justify-center py-4 text-lg"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Processing...
          </span>
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')
  const [checkoutData, setCheckoutData] = useState<{
    clientSecret: string
    orderId: string
    total: number
    items: CartItemWithVariant[]
  } | null>(null)
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'CA',
    phone: '',
    email: ''
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cart.length === 0 && !checkoutData) {
      router.push('/cart')
    }
  }, [cart, router, checkoutData])

  const isShippingValid = 
    shippingAddress.name.trim() !== '' &&
    shippingAddress.line1.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    shippingAddress.province.trim() !== '' &&
    shippingAddress.postal_code.trim() !== '' &&
    shippingAddress.country.trim() !== '' &&
    shippingAddress.email.trim() !== ''

  const handleProceedToPayment = async () => {
    if (!isShippingValid) {
      setError('Please fill in all required shipping fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (paymentMethod === 'crypto') {
        // NOWPayments checkout (100+ cryptos)
        const response = await fetch('/api/checkout/nowpayments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              variantId: item.variantId,
              quantity: item.qty
            })),
            shippingAddress: {
              name: shippingAddress.name,
              address: `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}`,
              city: shippingAddress.city,
              state: shippingAddress.province,
              zip: shippingAddress.postal_code,
              country: shippingAddress.country,
            },
            email: shippingAddress.email
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Crypto checkout failed')
        }

        const data = await response.json()
        // Redirect to NOWPayments hosted page
        window.location.href = data.invoiceUrl
      } else {
        // Card checkout (Stripe)
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart,
            shippingAddress
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Checkout failed')
        }

        const data = await response.json()
        setCheckoutData(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    clearCart()
    router.push('/account/orders')
  }

  if (cart.length === 0 && !checkoutData) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-5xl">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/cart" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to Cart
            </Link>
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            Checkout
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Shipping Address */}
            <div className="lg:col-span-3">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                  Shipping Address
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.line1}
                      onChange={(e) => setShippingAddress({...shippingAddress, line1: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="123 Water Street"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(e) => setShippingAddress({...shippingAddress, line2: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="Apt 4B (optional)"
                    />
                  </div>
                  
                  <div>
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="St. John's"
                    />
                  </div>
                  
                  <div>
                    <label>Province *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="NL"
                    />
                  </div>
                  
                  <div>
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="A1C 1A1"
                    />
                  </div>
                  
                  <div>
                    <label>Country *</label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      disabled={!!checkoutData}
                    >
                      <option value="CA">Canada</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                  
                  <div>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="(709) 555-0123 (optional)"
                    />
                  </div>
                  
                  <div>
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                      disabled={!!checkoutData}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              {!checkoutData && (
                <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    Payment Method
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className={`font-medium ${paymentMethod === 'card' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                          Credit Card
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">Visa, Mastercard, Amex</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'crypto'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        {/* Bitcoin icon */}
                        <svg className="w-8 h-8 text-[#F7931A]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-1.81v-1.91c-1.29-.18-2.37-.67-3.24-1.46l1.14-1.36c.72.62 1.52.99 2.4 1.09v-2.84l-.47-.15c-1.54-.47-2.46-1.37-2.46-2.77 0-1.51 1.09-2.65 2.93-2.93V6h1.81v1.67c1.08.17 1.96.55 2.64 1.14l-1.08 1.38c-.58-.44-1.23-.73-1.94-.85v2.72l.52.17c1.64.53 2.53 1.35 2.53 2.85 0 1.59-1.13 2.72-2.97 3.01zm-1.01-8.64c-.66.1-1.02.49-1.02 1.04 0 .45.26.78.93 1.01l.09.03V8.45zm1.81 6.14v-2.14l-.12-.04c-.8-.26-1.2-.65-1.2-1.18 0-.51.38-.89 1.11-1.01v4.37z"/>
                        </svg>
                        <span className={`font-medium ${paymentMethod === 'crypto' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                          Cryptocurrency
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">BTC, ETH, DOGE & 100+ more</span>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'crypto' && (
                    <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                      <p className="text-sm text-[var(--text-secondary)]">
                        <span className="font-medium">Accepted:</span> Bitcoin, Ethereum, USDT, USDC, Dogecoin, Shiba Inu, XRP, Solana, Cardano, Polygon, and 100+ more cryptocurrencies
                      </p>
                    </div>
                  )}

                  {/* Proceed Button */}
                  <div className="mt-6">
                    <button
                      onClick={handleProceedToPayment}
                      disabled={!isShippingValid || isLoading}
                      className="btn-primary w-full justify-center py-4"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Processing...
                        </span>
                      ) : paymentMethod === 'crypto' ? (
                        'Pay with Crypto'
                      ) : (
                        'Continue to Card Payment'
                      )}
                    </button>
                    {!isShippingValid && (
                      <p className="mt-3 text-sm text-[var(--text-muted)] text-center">
                        Please fill in all required fields (*)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Form */}
              {checkoutData && (
                <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    Payment
                  </h2>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: checkoutData.clientSecret,
                    }}
                  >
                    <CheckoutForm
                      clientSecret={checkoutData.clientSecret}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                  Order Summary
                </h2>

                {checkoutData ? (
                  <div className="space-y-4">
                    {checkoutData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] truncate">{item.variant.sku}</p>
                          <p className="text-[var(--text-muted)]">Qty: {item.qty}</p>
                        </div>
                        <span className="text-[var(--text-primary)] ml-4">
                          ${((item.variant.price_cents * item.qty) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-[var(--border-primary)] space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Subtotal</span>
                        <span className="text-[var(--text-primary)]">${(checkoutData.total / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Shipping</span>
                        <span className="text-[var(--text-muted)]">Free</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[var(--border-primary)]">
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--text-primary)]">Total</span>
                        <span className="text-xl font-bold text-[var(--text-primary)]">
                          ${(checkoutData.total / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[var(--text-secondary)]">{cart.length} item(s) in cart</p>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                      Complete shipping info to see total
                    </p>
                  </div>
                )}

                {/* Secure checkout badge */}
                <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
