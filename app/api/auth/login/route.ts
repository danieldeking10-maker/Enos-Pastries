import { NextResponse } from 'next/server'
import { createSessionCookieValue, isAdminEmail, verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // "use their normal mail" requirement means: accept the email password the user types.
    // There is no external mail provider; so password must be stored/verified by us.
    // To keep this self-contained, we accept a password only if there's a matching User in DB.
    // If user doesn't exist yet, prompt to sign up.

    // We will store/verify password hashes in the database using a simple salted hash.
    // Avoid external deps.
    const crypto = await import('crypto')
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please sign up first.' }, { status: 404 })
    }

    if (!verifyPassword(user.password, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Mark as admin if DB role is ADMIN OR email matches admin list.
    const role = user.role === 'ADMIN' || isAdminEmail(email) ? 'ADMIN' : 'CUSTOMER'

    const sessionCookie = createSessionCookieValue({ email, role })
    const res = NextResponse.json({ ok: true, role })
    res.cookies.set('auth_session', sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

