import { Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { rewardItem as rewardItemTable } from '../database/schema'

export interface CreateRewardInput {
  name: string
  pointsRequired: number
  type: string
  description: string
}

export interface UpdateRewardInput {
  name?: string
  pointsRequired?: number
  type?: string
  description?: string
}

@Injectable()
export class RewardsService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    return this.db.db.select().from(rewardItemTable)
  }

  async create(data: CreateRewardInput) {
    const id = randomUUID()
    await this.db.db.insert(rewardItemTable).values({
      id,
      name: data.name,
      pointsRequired: data.pointsRequired,
      type: data.type,
      description: data.description,
    })
    const rows = await this.db.db.select().from(rewardItemTable).where(eq(rewardItemTable.id, id)).limit(1)
    return rows[0]!
  }

  async update(id: string, data: UpdateRewardInput) {
    const existing = await this.db.db.select().from(rewardItemTable).where(eq(rewardItemTable.id, id)).limit(1)
    if (!existing[0]) throw new NotFoundException('Recompensa não encontrada')
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.pointsRequired !== undefined) payload.pointsRequired = data.pointsRequired
    if (data.type !== undefined) payload.type = data.type
    if (data.description !== undefined) payload.description = data.description
    if (Object.keys(payload).length === 0) return existing[0]
    await this.db.db.update(rewardItemTable).set(payload).where(eq(rewardItemTable.id, id))
    const rows = await this.db.db.select().from(rewardItemTable).where(eq(rewardItemTable.id, id)).limit(1)
    return rows[0]!
  }

  async remove(id: string) {
    const existing = await this.db.db.select().from(rewardItemTable).where(eq(rewardItemTable.id, id)).limit(1)
    if (!existing[0]) throw new NotFoundException('Recompensa não encontrada')
    await this.db.db.delete(rewardItemTable).where(eq(rewardItemTable.id, id))
    return { deleted: id }
  }
}
