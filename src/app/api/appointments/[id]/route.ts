import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { appointment as appointmentTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as Record<string, unknown>

    const update: Record<string, unknown> = {}
    if (body.status !== undefined) update.status = body.status
    if (body.data !== undefined) update.data = body.data
    if (body.horario !== undefined) update.horario = body.horario
    if (body.tipo !== undefined) update.tipo = body.tipo
    if (body.observacoes !== undefined) update.observacoes = body.observacoes || null

    const { db } = await getDbContext()
    await db.update(appointmentTable).set(update as any).where(eq(appointmentTable.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
