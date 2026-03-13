import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)
  const existing = await prisma.priceTable.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = {}
  if (parsed.data.isActive !== undefined) update.isActive = parsed.data.isActive
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.price !== undefined) update.price = parsed.data.price
  if ('type' in parsed.data) update.type = parsed.data.type ?? null

  const updated = await prisma.priceTable.update({ where: { id }, data: update as never })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'PriceTable',
      entityId: id,
      action: 'UPDATE',
      oldValue: { name: existing.name, price: Number(existing.price), isActive: existing.isActive },
      newValue: update,
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ ...updated, price: Number(updated.price) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  const existing = await prisma.priceTable.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.priceTable.delete({ where: { id } })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'PriceTable',
      entityId: id,
      action: 'DELETE',
      oldValue: { name: existing.name, price: Number(existing.price), isActive: existing.isActive },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ success: true })
}
