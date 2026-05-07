import { getDb } from './client'
import { ensureMigrated } from './migrate'

export async function getDbContext() {
  const { db, pool } = getDb()
  await ensureMigrated(pool)
  return { db, pool }
}
