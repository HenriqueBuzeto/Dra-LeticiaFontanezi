# Sistema Web Odontológico Premium

Sistema **Mobile First** para clínica odontológica (ortodontia), com simulador AR, vídeos informativos, agenda do paciente, lembretes e integrações (WhatsApp, Google Maps).

---

## Stack

| Camada    | Tecnologias |
|----------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, react-hook-form + zod, react-tsparticles, react-router-dom |
| Backend  | NestJS, TypeScript, Prisma, PostgreSQL, JWT + Refresh Token, bcrypt |
| Deploy   | Vercel (front) + Railway/Render (back) |

---

## Design system

- **Deep Teal:** `#004E64`
- **Mist Gray:** `#E0E5E9`
- Roxo como cor de destaque
- Mobile First, bordas 2xl, sombras suaves, microinterações com Framer Motion

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL (local, Supabase ou Neon)
- npm ou yarn

---

## Como rodar

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env e preencha DATABASE_URL e JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Backend sobe em **http://localhost:4000**. API em **http://localhost:4000/api**.

### 2. Frontend

```bash
# Na raiz do projeto (Leticia Fontanezi)
npm install
npm run dev
```

Frontend sobe em **http://localhost:3000** e faz proxy de `/api` para o backend.

### 3. Banco de dados

Use um PostgreSQL (Supabase, Neon ou local) e defina no backend:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

---

## Estrutura do projeto

```
Leticia Fontanezi/
├── public/
├── src/
│   ├── components/   # UI, layout, Skeleton, Toaster
│   ├── contexts/    # AuthContext
│   ├── lib/         # api (axios)
│   ├── pages/       # auth (Login, Register), Dashboard, ARSimulator, Videos, Appointments, Reminders, Doctor, Profile
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── backend/
│   ├── prisma/
│   │   └── schema.prisma   # User, Appointment, Reminder, Video, ARSession
│   └── src/
│       ├── auth/          # login, register, refresh, JWT
│       ├── users/         # GET /users/me
│       ├── appointments/
│       ├── reminders/
│       ├── videos/
│       ├── ar-session/
│       └── prisma/
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Rotas do frontend

| Rota            | Descrição              |
|-----------------|------------------------|
| `/auth/login`   | Login                  |
| `/auth/register`| Cadastro               |
| `/dashboard`    | Início (próxima consulta, ações rápidas, vídeos) |
| `/ar-simulator` | Simulador AR (câmera + cores) |
| `/videos`       | Vídeos informativos    |
| `/appointments` | Minha agenda           |
| `/reminders`    | Lembretes e notificações |
| `/doctor`       | Sobre a doutora (WhatsApp, ligar, mapa) |
| `/profile`      | Perfil e sair          |

---

## API (backend)

| Método | Rota               | Auth | Descrição        |
|--------|--------------------|------|------------------|
| POST   | /api/auth/login    | Não  | Login            |
| POST   | /api/auth/register | Não  | Cadastro         |
| POST   | /api/auth/refresh  | Não  | Refresh token    |
| GET    | /api/users/me      | JWT  | Usuário logado   |
| GET    | /api/appointments  | JWT  | Lista consultas  |
| GET    | /api/reminders     | JWT  | Lista lembretes  |
| GET    | /api/videos        | Não  | Lista vídeos      |
| GET    | /api/ar-session    | JWT  | Sessões AR       |
| POST   | /api/ar-session    | JWT  | Salvar sessão AR |

---

## Funcionalidades

- **Auth:** Cadastro e login com e-mail/senha, JWT + refresh token, validação (zod no front, class-validator no back).
- **Dashboard:** Próxima consulta, ações rápidas (AR, Agenda, Vídeos), cards de vídeos.
- **Simulador AR:** Acesso à câmera, indicador de rastreamento, seleção de cor das borrachinhas, aplicar estilo e salvar imagem.
- **Vídeos:** Listagem por categoria (higiene, primeira consulta, cuidados com aparelho).
- **Agenda:** Lista de consultas por data e status (confirmado, pendente, cancelado).
- **Lembretes:** Lista, visualização lista/calendário, toggles de notificação (push, e-mail, silencioso).
- **Sobre a doutora:** Bio, especialidades, botões WhatsApp, Ligar e Localização (Google Maps).

---

## Integrações (opcional)

- **WhatsApp:** Link `https://wa.me/5511999999999` (ajustar número em `Doctor.tsx` e/ou backend).
- **Google Maps:** Link `https://www.google.com/maps/search/?api=1&query=...` (endereço em `Doctor.tsx`).
- **Firebase Push / Cloudinary:** Variáveis no `.env` do backend para implementação futura.

---

## Deploy

- **Frontend:** Conectar repositório na Vercel, build `npm run build`, output `dist`. Definir `VITE_API_URL` com a URL do backend.
- **Backend:** Railway ou Render, conectar repositório na pasta `backend`, build `npm run build`, start `npm run start`. Definir `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.

---

## Qualidade

- Código modular, tipado (TypeScript) no front e back.
- Design system consistente (Tailwind + cores e componentes reutilizáveis).
- Skeleton loading, toasts e animações suaves (Framer Motion).
- Prisma com migrations; auth com senha hasheada (bcrypt) e JWT.

---

**Dra. Letícia Fontanezi** — Sistema Odontológico Premium.
