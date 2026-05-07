import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { user as userTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toUserResponse } from '@/server/mappers/user'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { db } = await getDbContext()
    const rows = await db.select().from(userTable).where(eq(userTable.id, auth.id)).limit(1)
    const u = rows[0]
    if (!u) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    return NextResponse.json(toUserResponse(u))
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const body = (await req.json()) as Record<string, unknown>

    const allowed: Record<string, unknown> = {}
    for (const key of [
      'nome',
      'email',
      'telefone',
      'telefoneAlternativo',
      'dataNascimento',
      'genero',
      'endereco',
      'contatoEmergencia',
      'preferenciaLembrete',
      'avatar',
    ]) {
      if (key in body) allowed[key] = body[key]
    }

    if ('email' in allowed && typeof allowed.email === 'string') {
      allowed.email = allowed.email.trim().toLowerCase()
    }

    const update: Record<string, unknown> = {}
    if (allowed.nome !== undefined) update.nome = allowed.nome
    if (allowed.email !== undefined) update.email = allowed.email
    if (allowed.telefone !== undefined) update.telefone = allowed.telefone || null
    if (allowed.telefoneAlternativo !== undefined) update.telefoneAlternativo = allowed.telefoneAlternativo || null
    if (allowed.dataNascimento !== undefined) update.dataNascimento = allowed.dataNascimento || null
    if (allowed.genero !== undefined) update.genero = allowed.genero || null
    if (allowed.avatar !== undefined) update.avatar = allowed.avatar || null
    if (allowed.endereco !== undefined) update.endereco = allowed.endereco
    if (allowed.contatoEmergencia !== undefined) update.contatoEmergencia = allowed.contatoEmergencia
    if (allowed.preferenciaLembrete !== undefined) update.preferenciaLembrete = allowed.preferenciaLembrete || null

    const { db } = await getDbContext()
    if (Object.keys(update).length) {
      await db.update(userTable).set(update as any).where(eq(userTable.id, auth.id))
    }

    const rows = await db.select().from(userTable).where(eq(userTable.id, auth.id)).limit(1)
    const u = rows[0]
    if (!u) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    return NextResponse.json(toUserResponse(u))
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
