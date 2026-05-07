import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { pointLog as pointLogTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

const POINTS_BY_ACTION: Record<string, number> = {
  escovacao: 5,
  fio_dental: 5,
  consulta_presente: 25,
  limpeza_bucal: 15,
  uso_enxaguante: 5,
  checkin_semanal: 20,
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const body = (await req.json()) as { action?: string; metadata?: string }
    const action = body.action || ''
    if (!action) throw new Error('BAD_REQUEST')

    const points = POINTS_BY_ACTION[action] ?? 10

    const { db } = await getDbContext()
    await db.insert(pointLogTable).values({
      id: randomUUID(),
      userId: auth.id,
      action,
      points,
      metadata: body.metadata ?? null,
    } as any)

    const sumRows = await db
      .select({ total: sql<number>`COALESCE(SUM(${pointLogTable.points}), 0)` })
      .from(pointLogTable)
      .where(eq(pointLogTable.userId, auth.id))

    const total = (sumRows[0]?.total as any as number) ?? 0

    return NextResponse.json({ total })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
