import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import type { Pool } from 'pg'

let migrated = false

export async function ensureMigrated(pool: Pool) {
  if (migrated) return

  await pool.query(`
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

  await pool.query(`
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

  await pool.query(`
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

  await pool.query(`
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

  await pool.query(`
      CREATE TABLE IF NOT EXISTS ar_session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        cor_elastico TEXT,
        imagem_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

  await pool.query(`
      CREATE TABLE IF NOT EXISTS point_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        points INTEGER NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

  await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_item (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        category TEXT,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS image_url TEXT`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS category TEXT`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)
  await pool.query(`ALTER TABLE reward_item ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)

  await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_redemption (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        reward_id TEXT NOT NULL REFERENCES reward_item(id) ON DELETE CASCADE,
        points_cost INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        rejected_reason TEXT
      )
    `)

  await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointment(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminder(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ar_session_user ON ar_session(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_point_log_user ON point_log(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset(token_hash)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reward_redemption_user ON reward_redemption(user_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reward_redemption_reward ON reward_redemption(reward_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reward_redemption_status ON reward_redemption(status)`)

  await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

  for (const { table, triggerName } of [
    { table: '"user"', triggerName: 'tr_user_updated_at' },
    { table: 'appointment', triggerName: 'tr_appointment_updated_at' },
    { table: 'video', triggerName: 'tr_video_updated_at' },
    { table: 'reward_item', triggerName: 'tr_reward_item_updated_at' },
  ]) {
    await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table}`)
    await pool.query(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE PROCEDURE set_updated_at();
      `)
  }

  await seedVideos(pool)
  await seedDemoAdmin(pool)

  migrated = true
}

async function seedVideos(pool: Pool) {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM video')
  if ((count.rows[0] as { c: number })?.c > 0) return

  const now = new Date().toISOString()
  const videos = [
    { id: 'v1', titulo: 'A forma correta de escovar os dentes', descricao: 'Dicas de escovação', url: 'https://www.youtube.com/watch?v=example1', thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', categoria: 'higiene', duracao: 3 },
    { id: 'v2', titulo: 'Top 5 dicas de uso do fio dental', descricao: 'Uso do fio dental', url: 'https://www.youtube.com/watch?v=example2', thumbnail: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80', categoria: 'outros', duracao: 5 },
    { id: 'v3', titulo: 'Como limpar seu aparelho', descricao: 'Higiene com aparelho', url: 'https://www.youtube.com/watch?v=example3', thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', categoria: 'cuidados_aparelho', duracao: 4 },
    { id: 'v4', titulo: 'O que esperar na primeira consulta', descricao: 'Primeira visita', url: 'https://www.youtube.com/watch?v=example4', thumbnail: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80', categoria: 'primeira_consulta', duracao: 6 },
  ]

  for (const v of videos) {
    await pool.query(
      `INSERT INTO video (id, titulo, descricao, url, thumbnail, categoria, duracao, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         ON CONFLICT (id) DO NOTHING`,
      [v.id, v.titulo, v.descricao, v.url, v.thumbnail, v.categoria, v.duracao, now]
    )
  }
}

async function seedDemoAdmin(pool: Pool) {
  const email = 'teste@odontologico.com'
  const res = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])
  if (res.rows.length > 0) return

  const senhaHash = await bcrypt.hash('123456', 10)
  const id = randomUUID()
  await pool.query(
    `INSERT INTO "user" (id, nome, email, senha_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
    [id, 'Admin Teste', email, senhaHash]
  )
}
