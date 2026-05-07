import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { asc } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { video as videoTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET() {
  try {
    const { db } = await getDbContext()
    const rows = await db.select().from(videoTable).orderBy(asc(videoTable.createdAt))
    return NextResponse.json(
      rows.map((v: any) => ({
        id: v.id,
        titulo: v.titulo,
        descricao: v.descricao ?? undefined,
        url: v.url,
        thumbnail: v.thumbnail ?? undefined,
        categoria: v.categoria as any,
        duracao: v.duracao ?? undefined,
      }))
    )
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as {
      titulo?: string
      descricao?: string
      url?: string
      thumbnail?: string
      categoria?: string
      duracao?: number
    }

    if (!body.titulo || !body.url || !body.categoria) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const id = randomUUID()
    await db.insert(videoTable).values({
      id,
      titulo: body.titulo,
      descricao: body.descricao ?? null,
      url: body.url,
      thumbnail: body.thumbnail ?? null,
      categoria: body.categoria,
      duracao: body.duracao ?? null,
    } as any)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
