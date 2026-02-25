import { Controller, Get } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Controller('health')
export class HealthController {
  constructor(private db: DatabaseService) {}

  @Get()
  async check() {
    try {
      const { ok, tables } = await this.db.ping()
      return {
        ok,
        database: ok ? 'connected' : 'disconnected',
        tables,
      }
    } catch (err) {
      return {
        ok: false,
        database: 'error',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      }
    }
  }
}
