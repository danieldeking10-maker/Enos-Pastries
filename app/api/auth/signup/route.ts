import { NextResponse } from 'next/server'
import { hashPassword, isAdminEmail } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Restrict signup to the two admin emails.
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Only admin emails can sign up' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists. Please sign in.' }, { status: 409 })
    }

    const stored = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name: null,
        password: stored,
        role: 'ADMIN',
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}

