import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER']),
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  fees: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id: invoiceId } = await params
  const body = await req.json()
  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if ((invoice.status as string) === 'CANCELED') {
    return NextResponse.json({ error: 'Cannot add payment to a canceled invoice' }, { status: 409 })
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
      transactionId: parsed.data.transactionId,
      fees: parsed.data.fees,
      notes: parsed.data.notes,
      updatedAt: new Date(),
    } as never,
  })

  // Check if fully paid
  const allPayments = [...invoice.payments, payment]
  const paidSum = allPayments
    .filter((p) => !p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const refundSum = allPayments
    .filter((p) => p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const netPaid = paidSum - refundSum
  const total = Number(invoice.totalAmount)

  if (netPaid >= total && (invoice.status as string) !== 'PAID') {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date(), updatedAt: new Date() } as never,
    })

    await prisma.financialAuditLog.create({
      data: {
        entityType: 'Invoice',
        entityId: invoiceId,
        action: 'STATUS_CHANGE',
        oldValue: { status: invoice.status },
        newValue: { status: 'PAID' },
        changedBy: session.user.id,
        changedAt: new Date(),
      } as never,
    })
  }

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Payment',
      entityId: payment.id,
      action: 'CREATE',
      newValue: { invoiceId, amount: parsed.data.amount, method: parsed.data.method },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json(payment, { status: 201 })
}
