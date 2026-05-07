import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { video as videoTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as Record<string, unknown>

    const update: Record<string, unknown> = {}
    if (body.titulo !== undefined) update.titulo = body.titulo
    if (body.descricao !== undefined) update.descricao = (body.descricao as any) || null
    if (body.url !== undefined) update.url = body.url
    if (body.thumbnail !== undefined) update.thumbnail = (body.thumbnail as any) || null
    if (body.categoria !== undefined) update.categoria = body.categoria
    if (body.duracao !== undefined) update.duracao = (body.duracao as any) || null

    const { db } = await getDbContext()
    await db.update(videoTable).set(update as any).where(eq(videoTable.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const { db } = await getDbContext()
    await db.delete(videoTable).where(eq(videoTable.id, params.id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
