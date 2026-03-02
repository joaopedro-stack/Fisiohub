import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id: invoiceId, paymentId } = await params
  const prisma = getTenantPrisma(slug)

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.invoiceId !== invoiceId) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }
  if (payment.isRefund) {
    return NextResponse.json({ error: 'Cannot refund a refund payment' }, { status: 409 })
  }

  // Create refund payment
  const refund = await prisma.payment.create({
    data: {
      invoiceId,
      amount: payment.amount,
      method: payment.method,
      paidAt: new Date(),
      isRefund: true,
      notes: `Estorno do pagamento ${paymentId}`,
      updatedAt: new Date(),
    } as never,
  })

  // Recompute totals and possibly revert PAID → OPEN
  const allPayments = await prisma.payment.findMany({ where: { invoiceId } })
  const paidSum = allPayments
    .filter((p) => !p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const refundSum = allPayments
    .filter((p) => p.isRefund)
    .reduce((s, p) => s + Number(p.amount), 0)
  const netPaid = paidSum - refundSum

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (invoice && (invoice.status as string) === 'PAID' && netPaid < Number(invoice.totalAmount)) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'OPEN', paidAt: null, updatedAt: new Date() } as never,
    })

    await prisma.financialAuditLog.create({
      data: {
        entityType: 'Invoice',
        entityId: invoiceId,
        action: 'STATUS_CHANGE',
        oldValue: { status: 'PAID' },
        newValue: { status: 'OPEN' },
        changedBy: session.user.id,
        changedAt: new Date(),
      } as never,
    })
  }

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Payment',
      entityId: refund.id,
      action: 'CREATE',
      newValue: { refundOf: paymentId, amount: Number(payment.amount) },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ refund })
}
