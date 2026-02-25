#!/usr/bin/env node
/**
 * Cria um usuário admin no Supabase (Auth) com role 'admin' no user_metadata.
 * Use apenas localmente; nunca exponha SUPABASE_SERVICE_ROLE_KEY no frontend ou no repositório.
 *
 * Uso:
 *   node scripts/create-admin-user.mjs
 *
 * Variáveis de ambiente (em .env.local ou export no terminal):
 *   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
 *
 * O usuário criado terá:
 *   email: draleticiafontanezi@admin.com
 *   senha: Adminmaya
 *   user_metadata.role: 'admin' (acesso total no app)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'draleticiafontanezi@admin.com'
const ADMIN_PASSWORD = 'Adminmaya'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  console.error('   A Service Role Key está em: Supabase Dashboard → Project Settings → API → service_role')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('Criando usuário admin no Supabase...')
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      full_name: 'Dra. Letícia Fontanezi (Admin)',
      nome: 'Dra. Letícia Fontanezi (Admin)',
    },
  })

  if (error) {
    if (error.message && error.message.includes('already been registered')) {
      console.log('⚠️ Este e-mail já está cadastrado. Para virar admin, atualize o user_metadata no Dashboard:')
      console.log('   Authentication → Users → selecione o usuário → Edit → Raw User Meta Data: { "role": "admin" }')
    } else {
      console.error('❌ Erro:', error.message)
    }
    process.exit(1)
  }

  console.log('✅ Usuário admin criado com sucesso.')
  console.log('   E-mail:', ADMIN_EMAIL)
  console.log('   Senha:  (a que você definiu no script)')
  console.log('   Faça login em /auth/login para acessar o painel admin.')
}

main()
