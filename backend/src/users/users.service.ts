import { Injectable, ConflictException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { user as userTable } from '../database/schema'

interface CreateUserInput {
  nome: string
  email: string
  senha: string
  telefone?: string
  dataNascimento?: string
}

export interface UpdateProfileInput {
  nome?: string
  email?: string
  telefone?: string
  telefoneAlternativo?: string
  dataNascimento?: string
  genero?: string
  avatar?: string
  endereco?: Record<string, unknown>
  contatoEmergencia?: Record<string, unknown>
  preferenciaLembrete?: string
}

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    const rows = await this.db.db.select().from(userTable).where(eq(userTable.id, id)).limit(1)
    const u = rows[0]
    if (!u) return null
    return this.toProfile(u)
  }

  /** Lista todos os usuários (admin) – id, nome, email, role */
  async findAll() {
    const rows = await this.db.db.select({
      id: userTable.id,
      nome: userTable.nome,
      email: userTable.email,
      role: userTable.role,
    }).from(userTable).orderBy(asc(userTable.nome))
    return rows
  }

  async findByEmail(email: string) {
    const rows = await this.db.db.select().from(userTable).where(eq(userTable.email, email.toLowerCase())).limit(1)
    const u = rows[0]
    if (!u) return null
    return {
      ...this.toProfile(u),
      senhaHash: u.senhaHash,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }
  }

  async create(input: CreateUserInput) {
    const exists = await this.findByEmail(input.email)
    if (exists) throw new ConflictException('E-mail já cadastrado')
    const senhaHash = await bcrypt.hash(input.senha, 10)
    const id = randomUUID()
    await this.db.db.insert(userTable).values({
      id,
      nome: input.nome,
      email: input.email.toLowerCase(),
      senhaHash,
      telefone: input.telefone ?? null,
      dataNascimento: input.dataNascimento ?? null,
      role: 'paciente',
    })
    return this.findById(id) as Promise<ReturnType<typeof this.toProfile>>
  }

  /** Garante que a conta de teste admin existe e aceita senha 123456 (para login sempre funcionar). */
  async ensureTestAdmin(): Promise<void> {
    const email = 'teste@odontologico.com'
    const senhaPlana = '123456'
    const existing = await this.findByEmail(email)
    const senhaHash = await bcrypt.hash(senhaPlana, 10)
    if (!existing) {
      const id = randomUUID()
      await this.db.db.insert(userTable).values({
        id,
        nome: 'Admin Teste',
        email,
        senhaHash,
        role: 'admin',
      })
      return
    }
    await this.db.db
      .update(userTable)
      .set({ senhaHash, role: 'admin' })
      .where(eq(userTable.email, email))
  }

  async update(id: string, data: UpdateProfileInput) {
    const allowed: Record<string, unknown> = {}
    if (data.nome !== undefined) allowed.nome = data.nome
    if (data.email !== undefined) allowed.email = data.email.toLowerCase()
    if (data.telefone !== undefined) allowed.telefone = data.telefone || null
    if (data.telefoneAlternativo !== undefined) allowed.telefoneAlternativo = data.telefoneAlternativo || null
    if (data.dataNascimento !== undefined) allowed.dataNascimento = data.dataNascimento || null
    if (data.genero !== undefined) allowed.genero = data.genero || null
    if (data.avatar !== undefined) allowed.avatar = data.avatar || null
    if (data.endereco !== undefined) allowed.endereco = data.endereco
    if (data.contatoEmergencia !== undefined) allowed.contatoEmergencia = data.contatoEmergencia
    if (data.preferenciaLembrete !== undefined) allowed.preferenciaLembrete = data.preferenciaLembrete || null
    if (Object.keys(allowed).length === 0) return this.findById(id)
    if (data.email !== undefined) {
      const existing = await this.findByEmail(data.email)
      if (existing && existing.id !== id) throw new ConflictException('E-mail já está em uso')
    }
    await this.db.db.update(userTable).set(allowed as Record<string, unknown>).where(eq(userTable.id, id))
    return this.findById(id)
  }

  private toProfile(u: typeof userTable.$inferSelect) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? undefined,
      telefoneAlternativo: u.telefoneAlternativo ?? undefined,
      dataNascimento: u.dataNascimento ?? undefined,
      genero: u.genero ?? undefined,
      role: u.role,
      avatar: u.avatar ?? undefined,
      endereco: (u.endereco as Record<string, unknown>) ?? undefined,
      contatoEmergencia: (u.contatoEmergencia as Record<string, unknown>) ?? undefined,
      preferenciaLembrete: u.preferenciaLembrete ?? undefined,
    }
  }
}
