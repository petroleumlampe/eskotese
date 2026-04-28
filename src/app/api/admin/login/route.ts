import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getExpectedToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!password) {
    return NextResponse.json({ error: 'nö.' }, { status: 401 })
  }

  const provided = createSessionToken(password)
  const expected = getExpectedToken()

  if (provided !== expected) {
    return NextResponse.json({ error: 'nö.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
