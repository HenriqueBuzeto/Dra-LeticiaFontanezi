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

  /**
   * Auditoria detalhada do schema public (tabelas/colunas/constraints/índices/contagens).
   * Deve ser exposto apenas em endpoint protegido (admin-only).
   */
  async getDbReport() {
    if (!this.pool) throw new Error('Database pool não inicializado')

    const expectedTables = [
      'user',
      'appointment',
      'reminder',
      'video',
      'ar_session',
      'point_log',
      'reward_item',
      'password_reset',
    ] as const

    const existingTablesRes = await this.pool.query(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`
    )
    const existingTables = existingTablesRes.rows.map((r: { tablename: string }) => r.tablename)

    const missingTables = expectedTables.filter((t) => !existingTables.includes(t))
    const unexpectedTables = existingTables.filter((t) => !expectedTables.includes(t as (typeof expectedTables)[number]))

    const expectedByTable: Record<string, string[]> = {
      user: ['id', 'nome', 'email', 'telefone', 'telefone_alternativo', 'data_nascimento', 'genero', 'senha_hash', 'role', 'avatar', 'endereco', 'contato_emergencia', 'preferencia_lembrete', 'created_at', 'updated_at'],
      appointment: ['id', 'user_id', 'data', 'horario', 'status', 'tipo', 'observacoes', 'checkin_status', 'checkin_at', 'created_at', 'updated_at'],
      reminder: ['id', 'user_id', 'tipo', 'data_envio', 'status', 'titulo', 'mensagem', 'created_at'],
      video: ['id', 'titulo', 'descricao', 'url', 'thumbnail', 'categoria', 'duracao', 'created_at', 'updated_at'],
      ar_session: ['id', 'user_id', 'cor_elastico', 'imagem_url', 'created_at'],
      point_log: ['id', 'user_id', 'action', 'points', 'metadata', 'created_at'],
      reward_item: ['id', 'name', 'points_required', 'type', 'description'],
      password_reset: ['id', 'user_id', 'token_hash', 'expires_at', 'used_at', 'created_at'],
    }

    const tableReports: Record<
      string,
      {
        exists: boolean
        rowCount?: number
        columns?: { name: string; type: string; nullable: boolean; default: string | null }[]
        missingColumns?: string[]
        constraints?: { name: string; type: string; definition: string | null }[]
        indexes?: { name: string; definition: string }[]
      }
    > = {}

    const safeIdentifier = (name: string) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error(`Identificador inválido: ${name}`)
      return `"${name}"`
    }

    for (const table of expectedTables) {
      const exists = existingTables.includes(table)
      if (!exists) {
        tableReports[table] = { exists: false, missingColumns: expectedByTable[table].slice() }
        continue
      }

      const columnsRes = await this.pool.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
         ORDER BY ordinal_position`,
        [table]
      )
      const columns = columnsRes.rows.map((r: any) => ({
        name: r.column_name as string,
        type: r.data_type as string,
        nullable: (r.is_nullable as string) === 'YES',
        default: (r.column_default as string | null) ?? null,
      }))
      const existingColNames = new Set(columns.map((c) => c.name))
      const missingColumns = (expectedByTable[table] ?? []).filter((c) => !existingColNames.has(c))

      const countRes = await this.pool.query(`SELECT COUNT(*)::int AS c FROM ${safeIdentifier(table)}`)
      const rowCount = (countRes.rows[0] as { c: number })?.c ?? 0

      const constraintsRes = await this.pool.query(
        `SELECT c.conname AS name,
                CASE c.contype
                  WHEN 'p' THEN 'PRIMARY KEY'
                  WHEN 'u' THEN 'UNIQUE'
                  WHEN 'f' THEN 'FOREIGN KEY'
                  WHEN 'c' THEN 'CHECK'
                  ELSE c.contype::text
                END AS type,
                pg_get_constraintdef(c.oid) AS definition
         FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname='public' AND t.relname=$1
         ORDER BY c.conname`,
        [table]
      )
      const constraints = constraintsRes.rows.map((r: any) => ({
        name: r.name as string,
        type: r.type as string,
        definition: (r.definition as string | null) ?? null,
      }))

      const indexesRes = await this.pool.query(
        `SELECT indexname AS name, indexdef AS definition
         FROM pg_indexes
         WHERE schemaname='public' AND tablename=$1
         ORDER BY indexname`,
        [table]
      )
      const indexes = indexesRes.rows.map((r: any) => ({
        name: r.name as string,
        definition: r.definition as string,
      }))

      tableReports[table] = {
        exists: true,
        rowCount,
        columns,
        missingColumns,
        constraints,
        indexes,
      }
    }

    return {
      ok: missingTables.length === 0,
      schema: 'public',
      expectedTables,
      existingTables,
      missingTables,
      unexpectedTables,
      tables: tableReports,
      alerts: {
        healthEndpointDoesNotList: ['reward_item', 'password_reset'],
      },
    }
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointment(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminder(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ar_session_user ON ar_session(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_point_log_user ON point_log(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset(token_hash)`)

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
