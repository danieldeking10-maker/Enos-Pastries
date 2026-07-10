import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const status = body?.status
    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // Prisma enum values are: PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

