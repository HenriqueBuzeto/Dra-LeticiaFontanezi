#!/usr/bin/env node
/**
 * Cria/atualiza um usuário admin diretamente no PostgreSQL (Neon) na tabela "user".
 *
 * Uso:
 *   node scripts/create-admin-user.mjs
 *
 * Variáveis de ambiente (em backend/.env ou export no terminal):
 *   DATABASE_URL=postgresql://...
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Carrega .env.local se existir (Next.js) – tenta cwd e depois raiz do projeto
function loadEnvLocal() {
  const paths = [join(process.cwd(), '.env.local'), join(root, '.env.local')]
  for (const envPath of paths) {
    if (!existsSync(envPath)) continue
    let content = readFileSync(envPath, 'utf8')
    content = content.replace(/^\uFEFF/, '') // BOM
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (m) {
        const value = m[2].replace(/^["']|["']$/g, '').trim()
        if (!process.env[m[1]]) process.env[m[1]] = value
      }
    }
    return
  }
}

loadEnvLocal()

const databaseUrl = process.env.DATABASE_URL

const ADMIN_EMAIL = 'draleticiafontanezi@admin.com'
const ADMIN_PASSWORD = 'Adminmaya'

if (!databaseUrl) {
  console.error('❌ Defina DATABASE_URL (Neon) em backend/.env ou no ambiente')
  process.exit(1)
}

const { Pool } = pg
const pool = new Pool({ connectionString: databaseUrl, max: 1 })

async function main() {
  console.log('Criando/atualizando usuário admin no PostgreSQL (Neon)...')
  const client = await pool.connect()
  try {
    const senhaHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const existing = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [ADMIN_EMAIL])
    const id = existing.rows[0]?.id || randomUUID()

    await client.query(
      `INSERT INTO "user" (id, nome, email, senha_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE
       SET nome = EXCLUDED.nome,
           senha_hash = EXCLUDED.senha_hash,
           role = 'admin',
           updated_at = NOW()`,
      [id, 'Dra. Letícia Fontanezi (Admin)', ADMIN_EMAIL, senhaHash]
    )

    console.log('✅ Usuário admin criado/atualizado com sucesso.')
    console.log('   E-mail:', ADMIN_EMAIL)
    console.log('   Senha:  (a que você definiu no script)')
    console.log('   Faça login em /auth/login para acessar o painel admin.')
  } finally {
    client.release()
    await pool.end()
  }
}

main()
