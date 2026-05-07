import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { rewardItem as rewardItemTable } from '@/server/db/schema'
import { requireAdmin } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    requireAdmin(req)
    const body = (await req.json()) as Record<string, unknown>
    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.pointsRequired !== undefined) update.pointsRequired = body.pointsRequired
    if (body.type !== undefined) update.type = body.type
    if (body.description !== undefined) update.description = body.description
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl
    if (body.quantity !== undefined) update.quantity = body.quantity
    if (body.active !== undefined) update.active = body.active
    if (body.category !== undefined) update.category = body.category
    if (body.featured !== undefined) update.featured = body.featured

    const { db } = await getDbContext()
    await db.update(rewardItemTable).set(update as any).where(eq(rewardItemTable.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    requireAdmin(req)
    const { db } = await getDbContext()
    await db.delete(rewardItemTable).where(eq(rewardItemTable.id, params.id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
