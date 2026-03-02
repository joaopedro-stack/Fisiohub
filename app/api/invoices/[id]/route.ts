import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const patchSchema = z.object({
  notes: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['CANCELED']).optional(),
  insuranceStatus: z.enum(['BILLED', 'RECEIVED', 'PARTIAL', 'GLOSA']).optional(),
  insuranceReceivedAmount: z.number().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, cpf: true } },
      payments: { orderBy: { paidAt: 'asc' } },
      appointments: {
        select: {
          id: true,
          startTime: true,
          type: true,
          status: true,
          paymentValue: true,
        },
      },
    },
  })

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const paidSum = invoice.payments
    .filter((p) => !p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const refundSum = invoice.payments
    .filter((p) => p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const netPaid = paidSum - refundSum

  let effectiveStatus = invoice.status as string
  if (effectiveStatus === 'OPEN' && invoice.dueDate && invoice.dueDate < now) {
    effectiveStatus = 'OVERDUE'
  }

  return NextResponse.json({
    ...invoice,
    totalAmount: Number(invoice.totalAmount),
    netPaid,
    effectiveStatus,
  })
}

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
  const existing = await prisma.invoice.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((existing.status as string) === 'PAID') {
    return NextResponse.json({ error: 'Cannot modify a paid invoice' }, { status: 409 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes
  if (parsed.data.dueDate !== undefined) update.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
  if (parsed.data.status === 'CANCELED') update.status = 'CANCELED'
  if (parsed.data.insuranceStatus) update.insuranceStatus = parsed.data.insuranceStatus
  if (parsed.data.insuranceReceivedAmount !== undefined) update.insuranceReceivedAmount = parsed.data.insuranceReceivedAmount

  const updated = await prisma.invoice.update({
    where: { id },
    data: update as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Invoice',
      entityId: id,
      action: parsed.data.status === 'CANCELED' ? 'STATUS_CHANGE' : 'UPDATE',
      oldValue: { status: existing.status, notes: existing.notes },
      newValue: update,
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json(updated)
}
