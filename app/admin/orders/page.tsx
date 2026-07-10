'use client'

import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

type OrderType = 'RETAIL' | 'WHOLESALE'

type DeliveryType = 'PICKUP' | 'DELIVERY'

type OrderItem = {
  productId: string
  productName?: string
  quantity: number
  price: number
}

type Order = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderType: OrderType
  deliveryType: DeliveryType
  deliveryAddress: string | null
  deliveryDate: string | null
  totalAmount: number
  status: OrderStatus
  items: Array<{
    productId: string
    quantity: number
    price: number
    product?: { name: string } | null
  }>
  createdAt: string
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function prettyStatus(s: OrderStatus) {
  return s
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function prettyOrderType(t: OrderType) {
  return t === 'WHOLESALE' ? 'Wholesale' : 'Retail'
}

function prettyDeliveryType(d: DeliveryType) {
  return d === 'DELIVERY' ? 'Delivery' : 'Pickup'
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/orders', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = (await res.json()) as Order[]
        if (!isMounted) return
        setOrders(data)
      } catch (e: any) {
        if (!isMounted) return
        setError(e?.message ?? 'Failed to fetch orders')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const statusOptions: OrderStatus[] = useMemo(
    () => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
    []
  )

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // optimistic UI
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update order status')
      const updated = (await res.json()) as Order
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    } catch (e: any) {
      // rollback by re-fetching
      const res2 = await fetch('/api/orders', { cache: 'no-store' })
      if (res2.ok) setOrders((await res2.json()) as Order[])
      alert(e?.message ?? 'Failed to update order')
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-900">Manage Orders</h1>
        </div>

        {loading && <div className="text-center py-12">Loading...</div>}
        {error && !loading && (
          <div className="text-center py-12 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Order #{order.id}</h3>
                    <p className="text-gray-600">
                      {order.customerName} • {order.customerEmail} • {order.customerPhone}
                    </p>
                    <p className="text-sm text-gray-500">
                      {prettyOrderType(order.orderType)} • {prettyDeliveryType(order.deliveryType)}
                      {order.deliveryAddress ? ` • ${order.deliveryAddress}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
                      >
                        {prettyStatus(order.status)}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {prettyStatus(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {item.quantity}x {item.product?.name ?? item.productId}
                        </span>
                        <span className="text-gray-900 font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <span className="text-xl font-bold text-amber-700">
                      Total: ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md p-8">
                <p className="text-xl text-amber-700">No orders yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

