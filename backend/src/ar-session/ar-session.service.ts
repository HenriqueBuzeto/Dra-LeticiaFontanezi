import { Injectable } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { arSession as arSessionTable } from '../database/schema'

@Injectable()
export class ArSessionService {
  constructor(private db: DatabaseService) {}

  async create(userId: string, data: { corElastico?: string; imagemUrl?: string }) {
    const id = randomUUID()
    await this.db.db.insert(arSessionTable).values({
      id,
      userId,
      corElastico: data.corElastico ?? null,
      imagemUrl: data.imagemUrl ?? null,
    })
    const rows = await this.db.db.select().from(arSessionTable).where(eq(arSessionTable.id, id)).limit(1)
    return rows[0]!
  }

  async findByUser(userId: string) {
    return this.db.db
      .select()
      .from(arSessionTable)
      .where(eq(arSessionTable.userId, userId))
      .orderBy(desc(arSessionTable.createdAt))
  }
}
