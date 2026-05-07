import { NextRequest, NextResponse } from 'next/server'
import { and, eq, asc } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { appointment as appointmentTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { db } = await getDbContext()
    const rows = await db
      .select()
      .from(appointmentTable)
      .where(eq(appointmentTable.userId, auth.id))
      .orderBy(asc(appointmentTable.data), asc(appointmentTable.horario))

    return NextResponse.json(
      rows.map((a: any) => ({
        id: a.id,
        userId: a.userId,
        data: a.data,
        horario: a.horario,
        status: a.status as any,
        tipo: a.tipo ?? undefined,
        observacoes: a.observacoes ?? undefined,
        checkinStatus: (a.checkinStatus as any) ?? undefined,
        checkinAt: a.checkinAt ? new Date(a.checkinAt as any).toISOString() : undefined,
      }))
    )
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
