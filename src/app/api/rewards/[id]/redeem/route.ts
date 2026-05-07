import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { pointLog as pointLogTable, rewardItem as rewardItemTable, rewardRedemption as rewardRedemptionTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest, { params }: any) {
  try {
    const auth = requireAuth(req)
    const rewardId = params?.id as string
    if (!rewardId) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()

    const rewardRows = await db
      .select()
      .from(rewardItemTable)
      .where(and(eq(rewardItemTable.id, rewardId), eq(rewardItemTable.active, true), gt(rewardItemTable.quantity, 0)))
      .limit(1)

    const reward = rewardRows[0] as any
    if (!reward) throw new Error('NOT_FOUND')

    const sumRows = await db
      .select({ total: sql<number>`COALESCE(SUM(${pointLogTable.points}), 0)` })
      .from(pointLogTable)
      .where(eq(pointLogTable.userId, auth.id))

    const totalPoints = (sumRows[0]?.total as any as number) ?? 0
    if (totalPoints < (reward.pointsRequired as number)) throw new Error('BAD_REQUEST')

    const existingPending = await db
      .select()
      .from(rewardRedemptionTable)
      .where(and(eq(rewardRedemptionTable.userId, auth.id), eq(rewardRedemptionTable.rewardId, rewardId), eq(rewardRedemptionTable.status, 'pending')))
      .orderBy(desc(rewardRedemptionTable.requestedAt))
      .limit(1)

    if (existingPending.length > 0) {
      return NextResponse.json({ ok: true, id: existingPending[0]!.id, status: 'pending' })
    }

    const id = randomUUID()
    await db.insert(rewardRedemptionTable).values({
      id,
      userId: auth.id,
      rewardId,
      pointsCost: reward.pointsRequired,
      status: 'pending',
    } as any)

    return NextResponse.json({ ok: true, id, status: 'pending' })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
