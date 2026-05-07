import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { user as userTable } from '@/server/db/schema'
import { signAccessToken, signRefreshToken } from '@/server/auth/jwt'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    if (!email || !password) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const rows = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
    const u = rows[0]
    if (!u) return NextResponse.json({ message: 'E-mail ou senha inválidos' }, { status: 401 })

    const ok = await bcrypt.compare(password, u.senhaHash)
    if (!ok) return NextResponse.json({ message: 'E-mail ou senha inválidos' }, { status: 401 })

    const payload = { sub: u.id, email: u.email, role: u.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return NextResponse.json({
      user: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone ?? undefined,
        telefoneAlternativo: u.telefoneAlternativo ?? undefined,
        dataNascimento: u.dataNascimento ?? undefined,
        genero: u.genero ?? undefined,
        role: u.role as 'admin' | 'paciente',
        avatar: u.avatar ?? undefined,
        endereco: (u.endereco as any) ?? undefined,
        contatoEmergencia: (u.contatoEmergencia as any) ?? undefined,
        preferenciaLembrete: (u.preferenciaLembrete as any) ?? undefined,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
