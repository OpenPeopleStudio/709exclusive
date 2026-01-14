'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  paid_at: string | null
  fulfilled_at: string | null
  shipped_at: string | null
  cancelled_at: string | null
  tracking_number: string | null
  carrier: string | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'fulfilled': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.tracking_number && (
                      <p className="text-gray-600">
                        Tracking: {order.tracking_number}
                        {order.carrier && ` (${order.carrier})`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900">
                      ${(order.total_cents / 100).toFixed(2)}
                    </p>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="flex space-x-4 text-sm">
                  <div className={`flex items-center ${order.paid_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${order.paid_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Paid
                  </div>
                  <div className={`flex items-center ${order.fulfilled_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${order.fulfilled_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Fulfilled
                  </div>
                  <div className={`flex items-center ${order.shipped_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${order.shipped_at ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Shipped
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}