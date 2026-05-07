import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDbContext } from '@/server/db/context'
import { appointment as appointmentTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as {
      userId?: string
      data?: string
      horario?: string
      tipo?: string
      observacoes?: string
    }
    if (!body.userId || !body.data || !body.horario) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const id = randomUUID()
    await db.insert(appointmentTable).values({
      id,
      userId: body.userId,
      data: body.data,
      horario: body.horario,
      tipo: body.tipo ?? 'Consulta',
      observacoes: body.observacoes ?? null,
      status: 'pendente',
    })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
