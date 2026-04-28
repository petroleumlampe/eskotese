import crypto from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'eskotese_session'

function makeToken(password: string): string {
  const secret = process.env.ADMIN_PASSWORD || ''
  return crypto.createHmac('sha256', secret).update(password).digest('hex')
}

export function getExpectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD || ''
  return makeToken(pw)
}

export function createSessionToken(password: string): string {
  return makeToken(password)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return false
  return token === getExpectedToken()
}
