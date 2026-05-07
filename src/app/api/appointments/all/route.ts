import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { appointment as appointmentTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const url = new URL(req.url)
    const date = url.searchParams.get('date')

    const { db } = await getDbContext()
    const q = db.select().from(appointmentTable)
    const rows = date ? await q.where(eq(appointmentTable.data, date)).orderBy(asc(appointmentTable.data), asc(appointmentTable.horario)) : await q.orderBy(asc(appointmentTable.data), asc(appointmentTable.horario))

    return NextResponse.json(
      rows.map((a: any) => ({
        id: a.id,
        userId: a.userId,
        data: a.data,
        horario: a.horario,
        status: a.status,
        tipo: a.tipo ?? undefined,
        observacoes: a.observacoes ?? undefined,
      }))
    )
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
