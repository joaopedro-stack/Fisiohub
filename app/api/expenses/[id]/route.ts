import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const patchSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().optional(),
  category: z.enum(['RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'TAXES', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'PAID']).optional(),
  paidAt: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)
  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.amount !== undefined) update.amount = parsed.data.amount
  if (parsed.data.dueDate !== undefined) update.dueDate = new Date(parsed.data.dueDate)
  if (parsed.data.category !== undefined) update.category = parsed.data.category
  if (parsed.data.status !== undefined) {
    update.status = parsed.data.status
    if (parsed.data.status === 'PAID' && !parsed.data.paidAt) {
      update.paidAt = new Date()
    }
  }
  if (parsed.data.paidAt !== undefined) {
    update.paidAt = parsed.data.paidAt ? new Date(parsed.data.paidAt) : null
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: update as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Expense',
      entityId: id,
      action: parsed.data.status ? 'STATUS_CHANGE' : 'UPDATE',
      oldValue: { status: existing.status, amount: Number(existing.amount) },
      newValue: update,
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ ...updated, amount: Number(updated.amount) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.expense.delete({ where: { id } })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Expense',
      entityId: id,
      action: 'DELETE',
      oldValue: { ...existing, amount: Number(existing.amount) },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ success: true })
}
