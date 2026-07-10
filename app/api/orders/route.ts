import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await prisma.order.create({
      data: {
        totalAmount: body.totalAmount,
        status: body.status ?? 'PENDING',
        orderType: body.orderType ?? 'RETAIL',
        deliveryType: body.deliveryType ?? 'PICKUP',
        deliveryAddress: body.deliveryAddress,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
