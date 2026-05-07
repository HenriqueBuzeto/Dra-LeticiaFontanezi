import { NextResponse } from 'next/server'
import { getDb } from '@/server/db/client'
import { ensureMigrated } from '@/server/db/migrate'

export async function GET() {
  try {
    const { pool } = getDb()
    await ensureMigrated(pool)
    const res = await pool.query('SELECT 1')
    return NextResponse.json({ ok: !!res.rows?.length })
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
