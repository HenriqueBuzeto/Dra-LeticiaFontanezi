import { Injectable } from '@nestjs/common'
import { eq, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { pointLog } from '../database/schema'
import type { PointActionType } from './dto/add-points.dto'

const ACTION_POINTS: Record<PointActionType, number> = {
  escovacao: 5,
  fio_dental: 5,
  consulta_presente: 25,
  limpeza_bucal: 15,
  uso_enxaguante: 5,
  checkin_semanal: 20,
}

@Injectable()
export class PointsService {
  constructor(private db: DatabaseService) {}

  async addPoints(userId: string, action: PointActionType, metadata?: string) {
    const points = ACTION_POINTS[action] ?? 10
    const id = randomUUID()
    await this.db.db.insert(pointLog).values({
      id,
      userId,
      action,
      points,
      metadata: metadata ?? null,
    })
    const [row] = await this.db.db.select().from(pointLog).where(eq(pointLog.id, id)).limit(1)
    const total = await this.getTotalPoints(userId)
    return { log: row, total }
  }

  async getTotalPoints(userId: string): Promise<number> {
    const result = await this.db.db
      .select({ total: sql<number>`COALESCE(SUM(${pointLog.points}), 0)::int` })
      .from(pointLog)
      .where(eq(pointLog.userId, userId))
    return result[0]?.total ?? 0
  }

  async getHistory(userId: string, limit = 50) {
    return this.db.db
      .select()
      .from(pointLog)
      .where(eq(pointLog.userId, userId))
      .orderBy(desc(pointLog.createdAt))
      .limit(limit)
  }

  async getSummary(userId: string) {
    const [total] = await this.db.db
      .select({ total: sql<number>`COALESCE(SUM(${pointLog.points}), 0)::int` })
      .from(pointLog)
      .where(eq(pointLog.userId, userId))
    const history = await this.getHistory(userId, 20)
    return { totalPoints: total?.total ?? 0, recentLogs: history }
  }
}
