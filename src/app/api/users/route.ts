import { NextRequest, NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { user as userTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { db } = await getDbContext()
    const rows = await db
      .select({ id: userTable.id, nome: userTable.nome, email: userTable.email, role: userTable.role })
      .from(userTable)
      .orderBy(asc(userTable.nome))
    return NextResponse.json(rows)
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
