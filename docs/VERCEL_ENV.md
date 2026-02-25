# Variáveis de ambiente na Vercel

Configure em **Settings → Environment Variables**. Não commite valores reais no código.

## Login com Supabase (recomendado)

Para o **login e cadastro** funcionarem só com Supabase (sem backend NestJS), defina:

| Nome | Valor | Onde pegar |
|------|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Supabase → Project Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) | Supabase → Project Settings → API → **anon public** |

- **Sem barra no final** na URL.
- Use a **Anon Key** (JWT longa), não a `service_role`.
- Depois de salvar, faça **Redeploy** do projeto na Vercel.

O app usa Supabase Auth para login/registro quando essas duas variáveis estão definidas. Não é necessário `NEXT_PUBLIC_API_URL` para o login nesse caso.

**No painel do Supabase:** em **Authentication → Providers**, deixe **Email** habilitado para login com e-mail/senha.

## Backend NestJS (opcional)

Se você usar o backend para outras coisas (agenda, vídeos, etc.), adicione também:

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_URL` | URL do backend (ex.: `https://seu-app.railway.app`) |

## Segurança

- **Nunca** use `service_role` ou chaves secretas em variáveis `NEXT_PUBLIC_*` (elas vão para o bundle do cliente).
- A Anon Key é segura no frontend; a proteção dos dados é feita pelo **RLS** no Supabase.

## Local

Copie `.env.example` para `.env.local` e preencha os valores. O arquivo `.env.local` não é commitado (está no `.gitignore`).
