import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbContext } from '@/server/db/context'
import { appointment as appointmentTable } from '@/server/db/schema'
import { requireAuth } from '@/server/auth/request'
import { toHttpError } from '@/server/http/errors'

export async function POST(req: NextRequest, { params }: any) {
  try {
    const auth = requireAuth(req)
    const body = (await req.json()) as { status?: 'vai_comparecer' | 'nao_comparecer' }
    if (body.status !== 'vai_comparecer' && body.status !== 'nao_comparecer') throw new Error('BAD_REQUEST')

    const { db } = await getDbContext()
    await db
      .update(appointmentTable)
      .set({ checkinStatus: body.status, checkinAt: new Date() } as any)
      .where(eq(appointmentTable.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    const http = toHttpError(err)
    return NextResponse.json(http.body, { status: http.status })
  }
}
