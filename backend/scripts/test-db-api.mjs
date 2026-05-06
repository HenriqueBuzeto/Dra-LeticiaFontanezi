/**
 * Script para testar a comunicação da API com o banco PostgreSQL (Neon).
 * Execute: node scripts/test-db-api.mjs
 * Requer: backend rodando em http://localhost:4000
 */

const BASE = 'http://localhost:4000/api'

const log = (msg, data) => {
  console.log('\n' + '─'.repeat(60))
  console.log('►', msg)
  if (data !== undefined) console.log(data)
}

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) throw new Error(res.status + ' ' + (data?.message || data?.error || text))
  return data
}

async function main() {
  console.log('\n=== Teste de comunicação API ↔ PostgreSQL (Neon) ===\n')
  let token = null
  let userId = null
  let appointmentId = null

  try {
    // 1. Health + tabelas do banco
    log('1. Health check (conexão com o banco)', await request('GET', '/health'))
    const health = await request('GET', '/health')
    if (!health.ok) throw new Error('Banco não conectado')
    console.log('   Tabelas encontradas:', health.tables?.join(', ') || '—')

    // 2. Vídeos (dados do banco)
    const videos = await request('GET', '/videos')
    log('2. GET /videos (dados do banco)', { total: videos.length, primeiro: videos[0]?.titulo })

    // 3. Cadastro (criar usuário)
    const email = 'teste.' + Date.now() + '@teste.com'
    const registerRes = await request('POST', '/auth/register', {
      nome: 'Paciente Teste',
      email,
      senha: '123456',
      telefone: '11999999999',
    })
    token = registerRes.accessToken
    userId = registerRes.user?.id
    log('3. POST /auth/register (criar cadastro)', { userId: registerRes.user?.id, email: registerRes.user?.email })

    // 4. Login
    const loginRes = await request('POST', '/auth/login', { email, password: '123456' })
    token = loginRes.accessToken
    log('4. POST /auth/login', { ok: !!loginRes.accessToken, user: loginRes.user?.nome })

    // 5. Perfil (ler)
    const me = await request('GET', '/users/me', null, token)
    log('5. GET /users/me (ler perfil)', { id: me.id, nome: me.nome, telefone: me.telefone })

    // 6. Perfil (alterar)
    const updated = await request('PATCH', '/users/me', { telefone: '11888887777' }, token)
    log('6. PATCH /users/me (alterar perfil)', { telefone: updated.telefone })

    // 7. Listar consultas (vazio)
    let appointments = await request('GET', '/appointments', null, token)
    log('7. GET /appointments (antes)', { total: appointments.length })

    // 8. Criar consulta
    const dataConsulta = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10)
    const created = await request(
      'POST',
      '/appointments',
      { data: dataConsulta, horario: '10:00', tipo: 'Avaliação', observacoes: 'Teste API' },
      token
    )
    appointmentId = created.id
    log('8. POST /appointments (criar consulta)', created)

    // 9. Listar consultas (com a nova)
    appointments = await request('GET', '/appointments', null, token)
    log('9. GET /appointments (depois)', { total: appointments.length, primeira: appointments[0] })

    // 10. Points (gamificação)
    const pointsSummary = await request('GET', '/points/summary', null, token)
    log('10. GET /points/summary', pointsSummary)
    const addPoints = await request('POST', '/points/add', { action: 'escovacao' }, token)
    log('11. POST /points/add (escovação)', addPoints)

    console.log('\n' + '═'.repeat(60))
    console.log('✅ Todos os testes passaram. API está comunicando com o banco corretamente.')
    console.log('═'.repeat(60) + '\n')
  } catch (err) {
    console.error('\n❌ Erro:', err.message)
    if (err.message.includes('fetch')) {
      console.error('   Certifique-se de que o backend está rodando: cd backend && npm run start:dev')
    }
    process.exit(1)
  }
}

main()
