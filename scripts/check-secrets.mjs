#!/usr/bin/env node
/**
 * Verifica se há padrões de dados sensíveis no código (para rodar antes de commitar).
 * Não lê arquivos em .gitignore (ex.: .env, node_modules).
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.cache'])
const IGNORE_FILES = new Set(['check-secrets.mjs', 'package-lock.json'])
const SCAN_EXT = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.yaml', '.yml']

const PLACEHOLDERS = /COLOQUE_SUA_SENHA|sua_anon_key|your-super-secret|your-refresh-secret|change-in-production|placeholder|example\.com|localhost/i

const PATTERNS = [
  { name: 'Senha em texto', regex: /(?:password|senha|passwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi },
  { name: 'JWT/Token em texto', regex: /(?:Bearer|token|jwt)\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { name: 'API key em texto', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi },
  { name: 'Secret em texto', regex: /(?:secret|jwt_secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
  { name: 'Connection string com senha', regex: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/i },
  { name: 'DATABASE_URL com senha real', regex: /DATABASE_URL\s*=\s*["']postgres[^"']*:[^"']*@/ },
]

function walk(dir, list = []) {
  if (!existsSync(dir)) return list
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    const rel = relative(root, full)
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) walk(full, list)
    } else if (e.isFile() && !IGNORE_FILES.has(e.name)) {
      const ext = (e.name.match(/\.[^.]+$/) || [])[0]
      if (SCAN_EXT.includes(ext) || e.name.startsWith('.env')) list.push(rel)
    }
  }
  return list
}

const files = [...walk(join(root, 'src')), ...walk(join(root, 'backend'))]
  .filter((f) => {
    if (f.includes('node_modules') || f.startsWith('backend/node_modules')) return false
    if (f.includes('.env') && !f.endsWith('.env.example')) return false
    return true
  })

let found = 0
for (const file of files) {
  const path = join(root, file)
  let content = ''
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    continue
  }
  const isExample = file.includes('.env.example') || file.includes('.example.')
  for (const { name, regex } of PATTERNS) {
    const matches = content.match(regex)
    if (matches) {
      const filtered = isExample ? matches.filter((m) => PLACEHOLDERS.test(m)) : matches
      const toReport = isExample ? matches.filter((m) => !PLACEHOLDERS.test(m)) : matches
      if (toReport.length === 0) continue
      console.error(`\n[check-secrets] ${name}: ${file}`)
      toReport.forEach((m) => console.error(`  → ${m.substring(0, 60)}${m.length > 60 ? '...' : ''}`))
      found++
    }
  }
}

if (found > 0) {
  console.error('\n❌ Remova dados sensíveis do código e use variáveis de ambiente (.env).')
  process.exit(1)
}
console.log('✓ Nenhum padrão de dado sensível encontrado no código.')
process.exit(0)
