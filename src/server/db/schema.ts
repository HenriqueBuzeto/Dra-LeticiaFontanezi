import { pgTable, text, integer, timestamp, date, jsonb } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  telefone: text('telefone'),
  telefoneAlternativo: text('telefone_alternativo'),
  dataNascimento: date('data_nascimento', { mode: 'string' }),
  genero: text('genero'),
  senhaHash: text('senha_hash').notNull(),
  role: text('role').notNull().default('paciente'),
  avatar: text('avatar'),
  endereco: jsonb('endereco').$type<Record<string, unknown>>(),
  contatoEmergencia: jsonb('contato_emergencia').$type<Record<string, unknown>>(),
  preferenciaLembrete: text('preferencia_lembrete'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appointment = pgTable('appointment', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
  horario: text('horario').notNull(),
  status: text('status').notNull().default('pendente'),
  tipo: text('tipo').default('Consulta'),
  observacoes: text('observacoes'),
  checkinStatus: text('checkin_status'),
  checkinAt: timestamp('checkin_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reminder = pgTable('reminder', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  dataEnvio: timestamp('data_envio', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('pendente'),
  titulo: text('titulo'),
  mensagem: text('mensagem'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const video = pgTable('video', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  url: text('url').notNull(),
  thumbnail: text('thumbnail'),
  categoria: text('categoria').notNull(),
  duracao: integer('duracao'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const arSession = pgTable('ar_session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  corElastico: text('cor_elastico'),
  imagemUrl: text('imagem_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pointLog = pgTable('point_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  points: integer('points').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const rewardItem = pgTable('reward_item', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  pointsRequired: integer('points_required').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
})

export const passwordReset = pgTable('password_reset', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserRow = typeof user.$inferSelect
export type AppointmentRow = typeof appointment.$inferSelect
export type ReminderRow = typeof reminder.$inferSelect
export type VideoRow = typeof video.$inferSelect
export type ARSessionRow = typeof arSession.$inferSelect
export type PointLogRow = typeof pointLog.$inferSelect
export type RewardItemRow = typeof rewardItem.$inferSelect
export type PasswordResetRow = typeof passwordReset.$inferSelect
