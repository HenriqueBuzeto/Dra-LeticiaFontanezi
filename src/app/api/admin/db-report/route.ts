import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/request'
import { getDb } from '@/server/db/client'
import { ensureMigrated } from '@/server/db/migrate'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { pool } = getDb()
    await ensureMigrated(pool)

    const expectedTables = [
      'user',
      'appointment',
      'reminder',
      'video',
      'ar_session',
      'point_log',
      'reward_item',
      'password_reset',
    ] as const

    const existingTablesRes = await pool.query(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`
    )
    const existingTables = existingTablesRes.rows.map((r: { tablename: string }) => r.tablename)

    const missingTables = expectedTables.filter((t) => !existingTables.includes(t))
    const unexpectedTables = existingTables.filter((t) => !expectedTables.includes(t as any))

    const tableReports: Record<string, any> = {}

    const safeIdentifier = (name: string) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error(`Identificador inválido: ${name}`)
      return `"${name}"`
    }

    for (const table of expectedTables) {
      const exists = existingTables.includes(table)
      if (!exists) {
        tableReports[table] = { exists: false }
        continue
      }

      const columnsRes = await pool.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
         ORDER BY ordinal_position`,
        [table]
      )
      const columns = columnsRes.rows.map((r: any) => ({
        name: r.column_name as string,
        type: r.data_type as string,
        nullable: (r.is_nullable as string) === 'YES',
        default: (r.column_default as string | null) ?? null,
      }))

      const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM ${safeIdentifier(table)}`)
      const rowCount = (countRes.rows[0] as { c: number })?.c ?? 0

      tableReports[table] = { exists: true, rowCount, columns }
    }

    return NextResponse.json({
      ok: missingTables.length === 0,
      schema: 'public',
      expectedTables,
      existingTables,
      missingTables,
      unexpectedTables,
      tables: tableReports,
    })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
