import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { eq, asc, desc, isNotNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { appointment as appointmentTable, user as userTable } from '../database/schema'

@Injectable()
export class AppointmentsService {
  constructor(private db: DatabaseService) {}

  async create(userId: string, data: { data: string; horario: string; tipo?: string; observacoes?: string }) {
    const id = randomUUID()
    await this.db.db.insert(appointmentTable).values({
      id,
      userId,
      data: data.data,
      horario: data.horario,
      tipo: data.tipo ?? 'Consulta',
      observacoes: data.observacoes ?? null,
    })
    const rows = await this.db.db.select().from(appointmentTable).where(eq(appointmentTable.id, id)).limit(1)
    const a = rows[0]!
    return { id: a.id, userId: a.userId, data: a.data, horario: a.horario, status: a.status, tipo: a.tipo, observacoes: a.observacoes }
  }

  async findByUser(userId: string) {
    const list = await this.db.db
      .select()
      .from(appointmentTable)
      .where(eq(appointmentTable.userId, userId))
      .orderBy(asc(appointmentTable.data), asc(appointmentTable.horario))
    return list.map((a) => ({
      id: a.id,
      userId: a.userId,
      data: a.data,
      horario: a.horario,
      status: a.status,
      tipo: a.tipo,
      observacoes: a.observacoes,
      checkinStatus: a.checkinStatus ?? undefined,
      checkinAt: a.checkinAt ?? undefined,
    }))
  }

  /** Paciente confirma check-in antecipado: vai comparecer ou não. */
  async checkin(appointmentId: string, userId: string, status: 'vai_comparecer' | 'nao_comparecer') {
    const rows = await this.db.db.select().from(appointmentTable).where(eq(appointmentTable.id, appointmentId)).limit(1)
    const apt = rows[0]
    if (!apt) throw new NotFoundException('Consulta não encontrada')
    if (apt.userId !== userId) throw new ForbiddenException('Esta consulta não é sua')
    await this.db.db
      .update(appointmentTable)
      .set({ checkinStatus: status, checkinAt: new Date() })
      .where(eq(appointmentTable.id, appointmentId))
    const updated = await this.db.db.select().from(appointmentTable).where(eq(appointmentTable.id, appointmentId)).limit(1)
    return this.mapRow(updated[0]!)
  }

  /** Admin: lista check-ins recentes (paciente + consulta + status). */
  async findRecentCheckins(limit = 30) {
    const rows = await this.db.db
      .select({
        id: appointmentTable.id,
        userId: appointmentTable.userId,
        userName: userTable.nome,
        data: appointmentTable.data,
        horario: appointmentTable.horario,
        tipo: appointmentTable.tipo,
        checkinStatus: appointmentTable.checkinStatus,
        checkinAt: appointmentTable.checkinAt,
      })
      .from(appointmentTable)
      .innerJoin(userTable, eq(appointmentTable.userId, userTable.id))
      .where(isNotNull(appointmentTable.checkinAt))
      .orderBy(desc(appointmentTable.checkinAt))
      .limit(limit)
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      data: r.data,
      horario: r.horario,
      tipo: r.tipo,
      checkinStatus: r.checkinStatus,
      checkinAt: r.checkinAt,
    }))
  }

  /** Admin: lista todas as consultas, opcionalmente filtro por data (YYYY-MM-DD) */
  async findAll(date?: string) {
    if (date) {
      const rows = await this.db.db
        .select()
        .from(appointmentTable)
        .where(eq(appointmentTable.data, date))
        .orderBy(asc(appointmentTable.horario))
      return rows.map(this.mapRow)
    }
    const rows = await this.db.db.select().from(appointmentTable).orderBy(asc(appointmentTable.data), asc(appointmentTable.horario))
    return rows.map(this.mapRow)
  }

  async update(id: string, data: { status?: string; data?: string; horario?: string; tipo?: string; observacoes?: string }) {
    const existing = await this.db.db.select().from(appointmentTable).where(eq(appointmentTable.id, id)).limit(1)
    if (!existing[0]) throw new NotFoundException('Consulta não encontrada')
    const payload: Record<string, unknown> = {}
    if (data.status !== undefined) payload.status = data.status
    if (data.data !== undefined) payload.data = data.data
    if (data.horario !== undefined) payload.horario = data.horario
    if (data.tipo !== undefined) payload.tipo = data.tipo
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes
    if (Object.keys(payload).length === 0) return this.mapRow(existing[0])
    await this.db.db.update(appointmentTable).set(payload).where(eq(appointmentTable.id, id))
    const rows = await this.db.db.select().from(appointmentTable).where(eq(appointmentTable.id, id)).limit(1)
    return this.mapRow(rows[0]!)
  }

  private mapRow(a: typeof appointmentTable.$inferSelect) {
    return {
      id: a.id,
      userId: a.userId,
      data: a.data,
      horario: a.horario,
      status: a.status,
      tipo: a.tipo,
      observacoes: a.observacoes,
      checkinStatus: a.checkinStatus ?? undefined,
      checkinAt: a.checkinAt ?? undefined,
    }
  }
}
