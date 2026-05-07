import jwt from 'jsonwebtoken'

export type JwtPayload = {
  sub: string
  email: string
  role: string
}

export function signAccessToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET || 'change-me-in-production'
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || '15m' })
}

export function signRefreshToken(payload: JwtPayload) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'change-me-in-production'
  return jwt.verify(token, secret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
  return jwt.verify(token, secret) as JwtPayload
}
