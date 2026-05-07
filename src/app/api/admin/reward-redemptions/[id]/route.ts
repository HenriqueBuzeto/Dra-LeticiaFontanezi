import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, eq, sql } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { pointLog as pointLogTable, rewardItem as rewardItemTable, rewardRedemption as rewardRedemptionTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled'

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    requireAdmin(req)

    const id = params?.id as string
    if (!id) throw new Error('BAD_REQUEST')

    const body = (await req.json()) as {
      status?: RedemptionStatus
      rejectedReason?: string
    }

    const nextStatus = body.status
    if (!nextStatus) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()

    await db.transaction(async (tx) => {
      const rows = await tx.select().from(rewardRedemptionTable).where(eq(rewardRedemptionTable.id, id)).limit(1)
      const redemption = rows[0] as any
      if (!redemption) throw new Error('NOT_FOUND')

      if (nextStatus === 'approved') {
        if (redemption.status !== 'pending') throw new Error('BAD_REQUEST')

        const rewardRows = await tx.select().from(rewardItemTable).where(eq(rewardItemTable.id, redemption.rewardId)).limit(1)
        const reward = rewardRows[0] as any
        if (!reward || !reward.active || (reward.quantity ?? 0) <= 0) throw new Error('BAD_REQUEST')

        const sumRows = await tx
          .select({ total: sql<number>`COALESCE(SUM(${pointLogTable.points}), 0)` })
          .from(pointLogTable)
          .where(eq(pointLogTable.userId, redemption.userId))

        const totalPoints = (sumRows[0]?.total as any as number) ?? 0
        if (totalPoints < redemption.pointsCost) throw new Error('BAD_REQUEST')

        await tx.update(rewardItemTable).set({ quantity: (reward.quantity ?? 0) - 1 } as any).where(eq(rewardItemTable.id, reward.id))

        await tx.update(rewardRedemptionTable)
          .set({ status: 'approved', approvedAt: new Date() } as any)
          .where(eq(rewardRedemptionTable.id, id))

        await tx.insert(pointLogTable).values({
          id: randomUUID(),
          userId: redemption.userId,
          action: 'reward_redeem',
          points: -Math.abs(redemption.pointsCost),
          metadata: JSON.stringify({ rewardId: redemption.rewardId, redemptionId: redemption.id }),
        } as any)

        return
      }

      if (nextStatus === 'rejected') {
        if (redemption.status !== 'pending') throw new Error('BAD_REQUEST')
        const reason = (body.rejectedReason ?? '').trim()
        await tx.update(rewardRedemptionTable)
          .set({ status: 'rejected', rejectedReason: reason || null } as any)
          .where(eq(rewardRedemptionTable.id, id))
        return
      }

      if (nextStatus === 'delivered') {
        if (redemption.status !== 'approved') throw new Error('BAD_REQUEST')
        await tx.update(rewardRedemptionTable)
          .set({ status: 'delivered', deliveredAt: new Date() } as any)
          .where(eq(rewardRedemptionTable.id, id))
        return
      }

      if (nextStatus === 'cancelled') {
        if (redemption.status !== 'pending') throw new Error('BAD_REQUEST')
        await tx.update(rewardRedemptionTable)
          .set({ status: 'cancelled' } as any)
          .where(eq(rewardRedemptionTable.id, id))
        return
      }

      throw new Error('BAD_REQUEST')
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
