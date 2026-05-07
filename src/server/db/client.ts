import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type Db = NodePgDatabase<typeof schema>

let pool: Pool | null = null
let db: Db | null = null

export function getDb() {
  if (db) return { db, pool: pool! }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const requiresSsl = /(^|[?&])sslmode=require(&|$)/i.test(connectionString)
  pool = new Pool({
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
  })
  db = drizzle(pool, { schema })
  return { db, pool }
}
