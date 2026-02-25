# Segurança – Dados sensíveis e commits

Este documento descreve como manter o projeto seguro e **evitar vazamento de senhas, tokens e APIs** no código ao fazer commit.

## O que NUNCA deve ir para o repositório

- **Arquivos de ambiente com valores reais**: `.env`, `.env.local`, `backend/.env`
- **Senhas** (banco, serviços, JWT)
- **Tokens** (JWT, API keys, Bearer tokens)
- **URLs de banco com senha** (ex.: `postgresql://user:SENHA@host/db`)
- **Números/contatos reais** no código (use variáveis de ambiente em produção)

## O que já está protegido

1. **`.gitignore`**  
   Os arquivos `.env` e `backend/.env` estão ignorados. Não use `git add -f` nesses arquivos.

2. **Frontend**  
   - A API usa `VITE_API_URL` (ou proxy `/api`).  
   - Dados de contato (WhatsApp, telefone, endereço) podem ser definidos por variáveis de ambiente:  
     `VITE_DOCTOR_WHATSAPP`, `VITE_DOCTOR_PHONE`, `VITE_DOCTOR_ADDRESS`.  
   - Assim você não precisa colocar números/endereços reais no código.

3. **Backend**  
   - Toda configuração sensível deve estar em `backend/.env`:  
     `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, etc.  
   - Use sempre `backend/.env.example` como modelo, **sem valores reais**.

## Antes de cada commit

Rode o script que procura padrões perigosos no código:

```bash
npm run check:secrets
```

Se algo for encontrado, corrija (remova do código e use variáveis de ambiente) e rode de novo antes de commitar.

## Checklist rápido

- [ ] Nunca commitar `.env` ou `backend/.env`
- [ ] Em produção, trocar `JWT_SECRET` e `JWT_REFRESH_SECRET` por valores fortes e únicos
- [ ] Dados de contato reais: usar `VITE_DOCTOR_*` no `.env` (local ou do servidor), não no código
- [ ] Rodar `npm run check:secrets` antes de commitar
- [ ] Se algum `.env` com senha real já foi commitado no passado: trocar a senha no serviço (ex.: Supabase) e garantir que o arquivo foi removido do histórico ou que a senha foi alterada

## Onde colocar cada tipo de dado

| Dado              | Onde colocar                         | Exemplo (apenas modelo)        |
|-------------------|--------------------------------------|--------------------------------|
| URL da API        | `.env` → `VITE_API_URL`             | `VITE_API_URL=http://localhost:4000/api` |
| WhatsApp/telefone | `.env` → `VITE_DOCTOR_WHATSAPP` etc | `VITE_DOCTOR_WHATSAPP=5511999999999`    |
| Banco (backend)   | `backend/.env` → `DATABASE_URL`     | Ver `backend/.env.example`     |
| JWT (backend)     | `backend/.env` → `JWT_SECRET`       | Ver `backend/.env.example`     |

Os arquivos `.env.example` e `backend/.env.example` podem ser commitados **somente com placeholders** (sem senhas ou chaves reais).

## Conta de demonstração (backend)

O backend cria um usuário admin de teste (`teste@odontologico.com` / senha `123456`) apenas se ele ainda não existir. Em **produção**, desative esse seed ou altere a senha imediatamente após o primeiro deploy.
