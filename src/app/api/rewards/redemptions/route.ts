import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { rewardRedemption as rewardRedemptionTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { db } = await getDbContext()

    const rows = await db
      .select()
      .from(rewardRedemptionTable)
      .where(eq(rewardRedemptionTable.userId, auth.id))
      .orderBy(desc(rewardRedemptionTable.requestedAt))
      .limit(50)

    return NextResponse.json(rows)
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
