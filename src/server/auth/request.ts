import { NextRequest } from 'next/server'
import { verifyAccessToken } from './jwt'

export type AuthUser = { id: string; email: string; role: string }

export function getAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get('authorization')
  if (!header) return null
  const [type, token] = header.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return null
  try {
    const payload = verifyAccessToken(token)
    return { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const u = getAuthUser(req)
  if (!u) throw new Error('UNAUTHORIZED')
  return u
}

export function requireAdmin(req: NextRequest): AuthUser {
  const u = requireAuth(req)
  if (u.role !== 'admin') throw new Error('FORBIDDEN')
  return u
}
