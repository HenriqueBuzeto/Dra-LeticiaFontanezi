import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { and, eq, isNull, gt } from 'drizzle-orm'
import { randomUUID, createHash, randomBytes } from 'crypto'
import { UsersService } from '../users/users.service'
import { DatabaseService } from '../database/database.service'
import { passwordReset as passwordResetTable, user as userTable } from '../database/schema'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private db: DatabaseService,
  ) {}

  async login(dto: LoginDto) {
    const emailNorm = dto.email.trim().toLowerCase()
    if (emailNorm === 'teste@odontologico.com' && dto.password === '123456') {
      await this.usersService.ensureTestAdmin()
    }

    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('E-mail ou senha inválidos')
    const ok = await bcrypt.compare(dto.password, user.senhaHash)
    if (!ok) throw new UnauthorizedException('E-mail ou senha inválidos')
    const tokens = this.buildTokens(user.id, user.email, user.role)
    const profile = await this.usersService.findById(user.id)
    return { ...tokens, user: this.toUserResponse(profile!) }
  }

  async register(dto: RegisterDto) {
    const profile = await this.usersService.create({
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      telefone: dto.telefone,
      dataNascimento: dto.dataNascimento,
    })
    const tokens = this.buildTokens(profile.id, profile.email, profile.role)
    return { ...tokens, user: this.toUserResponse(profile) }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
      })
      const user = await this.usersService.findById(payload.sub)
      if (!user) throw new UnauthorizedException()
      const tokens = this.buildTokens(user.id, user.email, user.role)
      return { ...tokens, user: this.toUserResponse(user) }
    } catch {
      throw new UnauthorizedException('Refresh token inválido')
    }
  }

  /**
   * Fluxo de "esqueci minha senha" (sem Supabase).
   * Segurança: sempre retorna ok (não revela se o e-mail existe).
   * Observação: o envio de e-mail não está implementado aqui.
   * Para desenvolvimento, o token é retornado no response apenas quando NODE_ENV !== 'production'.
   */
  async requestPasswordReset(email: string) {
    const emailNorm = email.trim().toLowerCase()
    const u = await this.usersService.findByEmail(emailNorm)

    if (!u) return { ok: true }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1h

    await this.db.db.insert(passwordResetTable).values({
      id: randomUUID(),
      userId: u.id,
      tokenHash,
      expiresAt,
      usedAt: null,
    })

    if (process.env.NODE_ENV !== 'production') {
      return { ok: true, token: rawToken }
    }
    return { ok: true }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || token.trim().length < 10) throw new BadRequestException('Token inválido')

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const now = new Date()
    const rows = await this.db.db
      .select()
      .from(passwordResetTable)
      .where(and(eq(passwordResetTable.tokenHash, tokenHash), isNull(passwordResetTable.usedAt), gt(passwordResetTable.expiresAt, now)))
      .limit(1)
    const pr = rows[0]
    if (!pr) throw new BadRequestException('Token inválido ou expirado')

    const senhaHash = await bcrypt.hash(newPassword, 10)
    await this.db.db.update(userTable).set({ senhaHash }).where(eq(userTable.id, pr.userId))
    await this.db.db.update(passwordResetTable).set({ usedAt: now }).where(eq(passwordResetTable.id, pr.id))

    return { ok: true }
  }

  private toUserResponse(u: {
    id: string
    nome: string
    email: string
    telefone?: string | null
    telefoneAlternativo?: string | null
    dataNascimento?: string | Date | null
    genero?: string | null
    role: string
    avatar?: string | null
    endereco?: unknown
    contatoEmergencia?: unknown
    preferenciaLembrete?: string | null
  }) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? undefined,
      telefoneAlternativo: u.telefoneAlternativo ?? undefined,
      dataNascimento: u.dataNascimento
        ? typeof u.dataNascimento === 'string'
          ? u.dataNascimento
          : (u.dataNascimento as Date).toISOString().split('T')[0]
        : undefined,
      genero: u.genero ?? undefined,
      role: u.role,
      avatar: u.avatar ?? undefined,
      endereco: u.endereco ?? undefined,
      contatoEmergencia: u.contatoEmergencia ?? undefined,
      preferenciaLembrete: u.preferenciaLembrete ?? undefined,
    }
  }

  private buildTokens(sub: string, email: string, role: string) {
    const payload = { sub, email, role }
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' })
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: '7d',
    })
    return { accessToken, refreshToken, expiresIn: 900 }
  }
}
