import { Injectable } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { reminder as reminderTable } from '../database/schema'

@Injectable()
export class RemindersService {
  constructor(private db: DatabaseService) {}

  async findByUser(userId: string) {
    return this.db.db
      .select()
      .from(reminderTable)
      .where(eq(reminderTable.userId, userId))
      .orderBy(desc(reminderTable.dataEnvio))
  }

  /** Admin: lista todos os lembretes */
  async findAll() {
    return this.db.db
      .select()
      .from(reminderTable)
      .orderBy(desc(reminderTable.dataEnvio))
  }

  /** Admin: cria lembrete para um usuário */
  async create(userId: string, data: { tipo: string; dataEnvio: string; titulo?: string; mensagem?: string }) {
    const id = randomUUID()
    const dataEnvio = new Date(data.dataEnvio)
    await this.db.db.insert(reminderTable).values({
      id,
      userId,
      tipo: data.tipo,
      dataEnvio,
      status: 'pendente',
      titulo: data.titulo ?? null,
      mensagem: data.mensagem ?? null,
    })
    const rows = await this.db.db.select().from(reminderTable).where(eq(reminderTable.id, id)).limit(1)
    const r = rows[0]!
    return {
      id: r.id,
      userId: r.userId,
      tipo: r.tipo,
      dataEnvio: r.dataEnvio,
      status: r.status,
      titulo: r.titulo,
      mensagem: r.mensagem,
    }
  }
}
