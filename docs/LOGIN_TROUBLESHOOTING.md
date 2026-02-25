# Login com erro – o que fazer

O app pode usar **Supabase Auth** ou o **backend NestJS** para login:

- **Supabase:** Se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem definidos na Vercel, o login usa o Supabase (não precisa de backend).
- **Backend:** Caso contrário, o login chama o backend NestJS; aí é obrigatório `NEXT_PUBLIC_API_URL` e o backend no ar.

## Checklist na Vercel (login com Supabase)

1. **Variáveis para login com Supabase**
   - `NEXT_PUBLIC_SUPABASE_URL` = URL do projeto (ex.: `https://xxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon Key (em Project Settings → API)
   - Sem barra no final na URL.
2. **No Supabase:** Authentication → Providers → **Email** deve estar habilitado.

2. **Depois de salvar a variável**
   - Vá em **Deployments** → no último deploy → **⋯** → **Redeploy**.
   - Variáveis novas só valem em deploys feitos **depois** de salvar.

3. **Backend no ar**
   - O backend (pasta `backend/`) precisa estar hospedado (Railway, Render, etc.).
   - Se estiver só na sua máquina, a Vercel não consegue acessar.

## O que a mensagem de erro indica

| Mensagem | Causa provável |
|----------|-----------------|
| "Não foi possível conectar ao servidor. Confira: (1) NEXT_PUBLIC_API_URL..." | Backend inacessível: URL errada, não configurada ou backend fora do ar. |
| "Rota não encontrada. O backend está rodando?..." | Backend não responde em `/api/auth/login` (URL errada ou backend diferente). |
| "Erro no servidor (500)..." | Backend quebrou (ex.: banco de dados). Veja os logs do backend. |
| "E-mail ou senha incorretos." | Credenciais erradas ou usuário não existe no banco do backend. |

## Conferir no navegador

1. Abra o site (Vercel).
2. F12 → aba **Rede** (Network).
3. Tente fazer login.
4. Clique na requisição que for para `auth/login` ou `api`.
5. Veja:
   - **Status (failed)** ou **CORS/ERR_NETWORK** → backend inacessível ou URL errada.
   - **404** → rota não existe; confira a URL do backend.
   - **500** → erro no backend; confira logs e banco.

## Resumo

- **Login com Supabase:** defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel; não é preciso backend.
- **Login com backend:** defina `NEXT_PUBLIC_API_URL` e tenha o NestJS no ar (Railway/Render, etc.).
