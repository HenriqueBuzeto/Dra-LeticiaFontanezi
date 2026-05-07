import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { rewardRedemption as rewardRedemptionTable, rewardItem as rewardItemTable, user as userTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { db } = await getDbContext()

    const rows = await db
      .select({
        id: rewardRedemptionTable.id,
        status: rewardRedemptionTable.status,
        pointsCost: rewardRedemptionTable.pointsCost,
        requestedAt: rewardRedemptionTable.requestedAt,
        approvedAt: rewardRedemptionTable.approvedAt,
        deliveredAt: rewardRedemptionTable.deliveredAt,
        rejectedReason: rewardRedemptionTable.rejectedReason,
        user: {
          id: userTable.id,
          nome: userTable.nome,
          email: userTable.email,
        },
        reward: {
          id: rewardItemTable.id,
          name: rewardItemTable.name,
          type: rewardItemTable.type,
          pointsRequired: rewardItemTable.pointsRequired,
          imageUrl: rewardItemTable.imageUrl,
        },
      })
      .from(rewardRedemptionTable)
      .leftJoin(userTable, eq(rewardRedemptionTable.userId, userTable.id))
      .leftJoin(rewardItemTable, eq(rewardRedemptionTable.rewardId, rewardItemTable.id))
      .orderBy(desc(rewardRedemptionTable.requestedAt))
      .limit(200)

    return NextResponse.json(rows)
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
