import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { user as userTable } from '@/server/db/schema'
import { signAccessToken, signRefreshToken } from '@/server/auth/jwt'
import { toUserResponse } from '@/server/mappers/user'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      nome?: string
      email?: string
      senha?: string
      telefone?: string
      dataNascimento?: string
    }

    const nome = (body.nome || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const senha = body.senha || ''

    if (!nome || !email || senha.length < 6) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const exists = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1)
    if (exists.length) return NextResponse.json({ message: 'E-mail já cadastrado' }, { status: 409 })

    const id = randomUUID()
    const senhaHash = await bcrypt.hash(senha, 10)

    await db.insert(userTable).values({
      id,
      nome,
      email,
      senhaHash,
      telefone: body.telefone ?? null,
      dataNascimento: body.dataNascimento ?? null,
      role: 'paciente',
    })

    const rows = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1)
    const u = rows[0]!

    const payload = { sub: u.id, email: u.email, role: u.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return NextResponse.json({
      user: toUserResponse(u),
      accessToken,
      refreshToken,
      expiresIn: 900,
    })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
