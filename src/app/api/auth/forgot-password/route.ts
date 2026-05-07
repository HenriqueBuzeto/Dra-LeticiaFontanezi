import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID, createHash } from 'crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { passwordReset as passwordResetTable, user as userTable } from '@/server/db/schema'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ ok: true })

  const { db } = await getDbContext()
  const users = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
  const u = users[0]
  if (!u) return NextResponse.json({ ok: true })

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

  await db.insert(passwordResetTable).values({
    id: randomUUID(),
    userId: u.id,
    tokenHash,
    expiresAt,
    usedAt: null,
  })

  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ ok: true, token: rawToken })
  }

  return NextResponse.json({ ok: true })
}
