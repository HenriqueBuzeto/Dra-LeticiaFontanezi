import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { asc } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { rewardItem as rewardItemTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET() {
  try {
    const { db } = await getDbContext()
    const rows = await db.select().from(rewardItemTable).orderBy(asc(rewardItemTable.pointsRequired))
    return NextResponse.json(rows)
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as { name?: string; pointsRequired?: number; type?: string; description?: string }
    if (!body.name || !body.type || !body.description || !body.pointsRequired) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const id = randomUUID()
    await db.insert(rewardItemTable).values({
      id,
      name: body.name,
      pointsRequired: body.pointsRequired,
      type: body.type,
      description: body.description,
    } as any)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
