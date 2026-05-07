import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, asc, gt, eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { rewardItem as rewardItemTable } from '@/server/db/schema'
import { getAuthUser, requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function GET(req: NextRequest) {
  try {
    const { db } = await getDbContext()
    const auth = getAuthUser(req)
    const isAdmin = auth?.role === 'admin'

    const rows = isAdmin
      ? await db.select().from(rewardItemTable).orderBy(asc(rewardItemTable.pointsRequired))
      : await db
          .select()
          .from(rewardItemTable)
          .where(and(eq(rewardItemTable.active, true), gt(rewardItemTable.quantity, 0)))
          .orderBy(asc(rewardItemTable.pointsRequired))

    return NextResponse.json(rows)
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as {
      name?: string
      pointsRequired?: number
      type?: string
      description?: string
      imageUrl?: string
      quantity?: number
      active?: boolean
      category?: string
      featured?: boolean
    }
    if (!body.name || !body.type || !body.description || !body.pointsRequired) throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    const id = randomUUID()
    await db.insert(rewardItemTable).values({
      id,
      name: body.name,
      pointsRequired: body.pointsRequired,
      type: body.type,
      description: body.description,
      imageUrl: body.imageUrl ?? null,
      quantity: body.quantity ?? 0,
      active: body.active ?? true,
      category: body.category ?? null,
      featured: body.featured ?? false,
    } as any)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
