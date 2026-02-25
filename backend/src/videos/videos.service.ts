import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DatabaseService } from '../database/database.service'
import { video as videoTable } from '../database/schema'

export interface CreateVideoInput {
  titulo: string
  descricao?: string
  url: string
  thumbnail?: string
  categoria: string
  duracao?: number
}

export interface UpdateVideoInput {
  titulo?: string
  descricao?: string
  url?: string
  thumbnail?: string
  categoria?: string
  duracao?: number
}

@Injectable()
export class VideosService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    return this.db.db
      .select()
      .from(videoTable)
      .orderBy(desc(videoTable.createdAt))
  }

  async create(data: CreateVideoInput) {
    const id = randomUUID()
    await this.db.db.insert(videoTable).values({
      id,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      url: data.url,
      thumbnail: data.thumbnail ?? null,
      categoria: data.categoria,
      duracao: data.duracao ?? null,
    })
    const rows = await this.db.db.select().from(videoTable).where(eq(videoTable.id, id)).limit(1)
    return rows[0]!
  }

  async update(id: string, data: UpdateVideoInput) {
    const existing = await this.db.db.select().from(videoTable).where(eq(videoTable.id, id)).limit(1)
    if (!existing[0]) throw new NotFoundException('Vídeo não encontrado')
    const payload: Record<string, unknown> = {}
    if (data.titulo !== undefined) payload.titulo = data.titulo
    if (data.descricao !== undefined) payload.descricao = data.descricao ?? null
    if (data.url !== undefined) payload.url = data.url
    if (data.thumbnail !== undefined) payload.thumbnail = data.thumbnail ?? null
    if (data.categoria !== undefined) payload.categoria = data.categoria
    if (data.duracao !== undefined) payload.duracao = data.duracao ?? null
    if (Object.keys(payload).length === 0) return existing[0]
    await this.db.db.update(videoTable).set(payload).where(eq(videoTable.id, id))
    const rows = await this.db.db.select().from(videoTable).where(eq(videoTable.id, id)).limit(1)
    return rows[0]!
  }

  async remove(id: string) {
    const existing = await this.db.db.select().from(videoTable).where(eq(videoTable.id, id)).limit(1)
    if (!existing[0]) throw new NotFoundException('Vídeo não encontrado')
    await this.db.db.delete(videoTable).where(eq(videoTable.id, id))
    return { deleted: id }
  }
}
