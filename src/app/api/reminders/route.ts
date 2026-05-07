import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDbContext } from '@/server/db/context'
import { reminder as reminderTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as {
      userId?: string
      tipo?: 'push' | 'email' | 'whatsapp'
      dataEnvio?: string
      titulo?: string
      mensagem?: string
    }

    if (!body.userId || !body.tipo || !body.dataEnvio) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    await db.insert(reminderTable).values({
      id: randomUUID(),
      userId: body.userId,
      tipo: body.tipo,
      dataEnvio: new Date(body.dataEnvio),
      status: 'pendente',
      titulo: body.titulo ?? null,
      mensagem: body.mensagem ?? null,
    } as any)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
