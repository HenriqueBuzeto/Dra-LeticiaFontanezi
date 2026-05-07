import { NextRequest, NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { reminder as reminderTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { db } = await getDbContext()
    const rows = await db.select().from(reminderTable).orderBy(asc(reminderTable.dataEnvio))
    return NextResponse.json(
      rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        tipo: r.tipo,
        dataEnvio: new Date(r.dataEnvio as any).toISOString(),
        status: r.status,
        titulo: r.titulo ?? undefined,
        mensagem: r.mensagem ?? undefined,
      }))
    )
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
