import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

function ghp(amount: number) {
  // Paystack expects amount in kobo
  return Math.round(amount * 100)
}

export async function POST(request: Request) {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderType,
      deliveryType,
      deliveryAddress,
      deliveryDate,
      totalAmount,
      items,
    } = await request.json()

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 })
    }

    const order = await prisma.order.create({
      data: {
        totalAmount: Number(totalAmount),
        status: 'PENDING',
        orderType: orderType ?? 'RETAIL',
        deliveryType: deliveryType ?? 'PICKUP',
        deliveryAddress: deliveryAddress ?? null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        customerName,
        customerEmail,
        customerPhone,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })

    // Use a unique reference for Paystack and store it on the Order
    const reference = `order_${order.id}_${crypto.randomBytes(6).toString('hex')}`

    // Update order with reference (will require schema change)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paystackReference: reference,
      },
    })

    const amountKobo = ghp(Number(totalAmount))

    const origin = new URL(request.url).origin

    const body = {
      email: customerEmail,
      amount: amountKobo,
      reference,
      currency: 'GHS',
      channels: ['card', 'bank', 'mobile_money'],
      metadata: {
        orderId: order.id,
      },
      // Paystack will call this endpoint after payment is processed.
      callback_url: `${origin}/api/paystack/webhook`,
    }


    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data?.status) {
      // If Paystack init fails, mark order cancelled to avoid hanging
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      return NextResponse.json({
        error: data?.message || 'Failed to initialize Paystack transaction',
      }, { status: 500 })
    }

    const authorizationUrl = data?.data?.authorization_url
    return NextResponse.json({
      authorizationUrl,
      reference,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Paystack initialize error:', error)
    return NextResponse.json({ error: 'Paystack initialize failed' }, { status: 500 })
  }
}

