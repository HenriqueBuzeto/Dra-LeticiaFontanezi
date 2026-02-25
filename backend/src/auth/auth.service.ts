import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
