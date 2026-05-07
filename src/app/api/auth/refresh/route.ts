import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/server/auth/jwt'
import { getDbContext } from '@/server/db/context'
import { user as userTable } from '@/server/db/schema'
import { toUserResponse } from '@/server/mappers/user'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { refreshToken?: string }
  const token = body.refreshToken || ''
  try {
    const payload = verifyRefreshToken(token)
    const { db } = await getDbContext()
    const rows = await db.select().from(userTable).where(eq(userTable.id, payload.sub)).limit(1)
    const u = rows[0]
    if (!u) return NextResponse.json({ message: 'Refresh token inválido' }, { status: 401 })

    const nextPayload = { sub: u.id, email: u.email, role: u.role }
    return NextResponse.json({
      user: toUserResponse(u),
      accessToken: signAccessToken(nextPayload),
      refreshToken: signRefreshToken(nextPayload),
      expiresIn: 900,
    })
  } catch {
    return NextResponse.json({ message: 'Refresh token inválido' }, { status: 401 })
  }
}
