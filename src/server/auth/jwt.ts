import jwt, { type SignOptions } from 'jsonwebtoken'

export type JwtPayload = {
  sub: string
  email: string
  role: string
}

export function signAccessToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET || 'change-me-in-production'
  const expiresIn = (process.env.JWT_EXPIRES || '15m') as SignOptions['expiresIn']
  return jwt.sign(payload, secret, { expiresIn })
}

export function signRefreshToken(payload: JwtPayload) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
  const expiresIn = '7d' as SignOptions['expiresIn']
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'change-me-in-production'
  return jwt.verify(token, secret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
  return jwt.verify(token, secret) as JwtPayload
}
