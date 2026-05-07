import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcrypt'
import { createHash } from 'crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { passwordReset as passwordResetTable, user as userTable } from '@/server/db/schema'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string; newPassword?: string }
  const token = (body.token || '').trim()
  const newPassword = body.newPassword || ''

  if (!token || token.length < 10 || newPassword.length < 6) {
    return NextResponse.json({ message: 'Token ou senha inválidos' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const now = new Date()

  const { db } = await getDbContext()
  const rows = await db
    .select()
    .from(passwordResetTable)
    .where(and(eq(passwordResetTable.tokenHash, tokenHash), isNull(passwordResetTable.usedAt), gt(passwordResetTable.expiresAt, now)))
    .limit(1)

  const pr = rows[0]
  if (!pr) return NextResponse.json({ message: 'Token inválido ou expirado' }, { status: 400 })

  const senhaHash = await bcrypt.hash(newPassword, 10)
  await db.update(userTable).set({ senhaHash } as any).where(eq(userTable.id, pr.userId))
  await db.update(passwordResetTable).set({ usedAt: now } as any).where(eq(passwordResetTable.id, pr.id))

  return NextResponse.json({ ok: true })
}
