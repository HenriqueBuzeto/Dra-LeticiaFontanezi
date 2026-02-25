import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import * as schema from './schema'

export type DatabaseInstance = NodePgDatabase<typeof schema>

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null
  db!: DatabaseInstance

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.config.get<string>('DATABASE_URL')
    if (!connectionString) {
      throw new Error('DATABASE_URL é obrigatória para PostgreSQL. Defina no .env (veja backend/.env.example)')
    }
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    })
    this.db = drizzle(this.pool, { schema })
    await this.runMigrations()
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  /** Testa a conexão e retorna as tabelas do schema public (para health check). */
  async ping(): Promise<{ ok: boolean; tables: string[] }> {
    if (!this.pool) return { ok: false, tables: [] }
    const res = await this.pool.query('SELECT 1')
    if (!res.rows?.length) return { ok: false, tables: [] }
    const tablesRes = await this.pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('user', 'appointment', 'reminder', 'video', 'ar_session', 'point_log')
      ORDER BY tablename
    `)
    const tables = tablesRes.rows.map((r: { tablename: string }) => r.tablename)
    return { ok: true, tables }
  }

  private async runMigrations() {
    const client = this.pool!
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        telefone TEXT,
        telefone_alternativo TEXT,
        data_nascimento DATE,
        genero TEXT,
        senha_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'paciente',
        avatar TEXT,
        endereco JSONB,
        contato_emergencia JSONB,
        preferencia_lembrete TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await this.addUserColumnsIfNotExist(client)
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointment (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        horario TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        tipo TEXT DEFAULT 'Consulta',
        observacoes TEXT,
        checkin_status TEXT,
        checkin_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await this.addAppointmentCheckinColumnsIfNotExist(client)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminder (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        data_envio TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        titulo TEXT,
        mensagem TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS video (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        url TEXT NOT NULL,
        thumbnail TEXT,
        categoria TEXT NOT NULL,
        duracao INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ar_session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        cor_elastico TEXT,
        imagem_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS point_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        points INTEGER NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE TABLE IF NOT EXISTS reward_item (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points_required INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL
    )`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointment(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminder(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ar_session_user ON ar_session(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_point_log_user ON point_log(user_id)`)

    await this.runTriggers(client)
    await this.seedVideos(client)
    await this.seedDemoAdmin(client)
  }

  /** Usuário de teste para painel admin: teste@odontologico.com / 123456 */
  private async seedDemoAdmin(client: import('pg').Pool) {
    const email = 'teste@odontologico.com'
    const res = await client.query('SELECT id FROM "user" WHERE email = $1', [email])
    if (res.rows.length > 0) return
    const senhaHash = await bcrypt.hash('123456', 10)
    const id = 'demo-admin-test'
    await client.query(
      `INSERT INTO "user" (id, nome, email, senha_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [id, 'Admin Teste', email, senhaHash]
    )
  }

  /** Colunas de check-in na tabela appointment (para bancos já existentes). */
  private async addAppointmentCheckinColumnsIfNotExist(client: import('pg').Pool) {
    await client.query(`ALTER TABLE appointment ADD COLUMN IF NOT EXISTS checkin_status TEXT`)
    await client.query(`ALTER TABLE appointment ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMPTZ`)
  }

  /** Colunas extras da tabela user (para bancos já existentes). */
  private async addUserColumnsIfNotExist(client: import('pg').Pool) {
    const cols: [string, string][] = [
      ['telefone_alternativo', 'TEXT'],
      ['genero', 'TEXT'],
      ['endereco', 'JSONB'],
      ['contato_emergencia', 'JSONB'],
      ['preferencia_lembrete', 'TEXT'],
    ]
    for (const [name, type] of cols) {
      await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ${name} ${type}`)
    }
  }

  /** Seed inicial de vídeos (só insere se a tabela estiver vazia). */
  private async seedVideos(client: import('pg').Pool) {
    const count = await client.query('SELECT COUNT(*)::int AS c FROM video')
    if ((count.rows[0] as { c: number })?.c > 0) return
    const now = new Date().toISOString()
    const videos = [
      { id: 'v1', titulo: 'A forma correta de escovar os dentes', descricao: 'Dicas de escovação', url: 'https://www.youtube.com/watch?v=example1', thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', categoria: 'higiene', duracao: 3 },
      { id: 'v2', titulo: 'Top 5 dicas de uso do fio dental', descricao: 'Uso do fio dental', url: 'https://www.youtube.com/watch?v=example2', thumbnail: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80', categoria: 'outros', duracao: 5 },
      { id: 'v3', titulo: 'Como limpar seu aparelho', descricao: 'Higiene com aparelho', url: 'https://www.youtube.com/watch?v=example3', thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', categoria: 'cuidados_aparelho', duracao: 4 },
      { id: 'v4', titulo: 'O que esperar na primeira consulta', descricao: 'Primeira visita', url: 'https://www.youtube.com/watch?v=example4', thumbnail: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80', categoria: 'primeira_consulta', duracao: 6 },
    ]
    for (const v of videos) {
      await client.query(
        `INSERT INTO video (id, titulo, descricao, url, thumbnail, categoria, duracao, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         ON CONFLICT (id) DO NOTHING`,
        [v.id, v.titulo, v.descricao, v.url, v.thumbnail, v.categoria, v.duracao, now]
      )
    }
  }

  /** Função e triggers para atualizar updated_at automaticamente. */
  private async runTriggers(client: import('pg').PoolClient | import('pg').Pool) {
    const query = (q: string) => client.query(q)
    await query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    const tablesWithUpdatedAt = [
      { table: '"user"', triggerName: 'tr_user_updated_at' },
      { table: 'appointment', triggerName: 'tr_appointment_updated_at' },
      { table: 'video', triggerName: 'tr_video_updated_at' },
    ]
    for (const { table, triggerName } of tablesWithUpdatedAt) {
      await query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table}`)
      await query(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE PROCEDURE set_updated_at();
      `)
    }
  }
}
