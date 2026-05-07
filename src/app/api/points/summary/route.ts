import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { pointLog as pointLogTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { db } = await getDbContext()

    const sumRows = await db
      .select({ total: sql<number>`COALESCE(SUM(${pointLogTable.points}), 0)` })
      .from(pointLogTable)
      .where(eq(pointLogTable.userId, auth.id))

    const totalPoints = (sumRows[0]?.total as any as number) ?? 0

    const logs = await db
      .select()
      .from(pointLogTable)
      .where(eq(pointLogTable.userId, auth.id))
      .orderBy(desc(pointLogTable.createdAt))
      .limit(50)

    return NextResponse.json({
      totalPoints,
      recentLogs: logs.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        action: l.action as any,
        points: l.points,
        metadata: l.metadata ?? undefined,
        createdAt: new Date(l.createdAt as any).toISOString(),
      })),
    })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
