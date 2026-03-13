import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const patchSchema = z.object({
  paid: z.boolean(),
  method: z.enum(['CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id, installmentId } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)

  const installment = await prisma.installment.findUnique({ where: { id: installmentId } })
  if (!installment || installment.invoiceId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.installment.update({
    where: { id: installmentId },
    data: {
      paidAt: parsed.data.paid ? new Date() : null,
      method: parsed.data.paid ? (parsed.data.method ?? null) : null,
    } as never,
  })

  const method = parsed.data.method ?? 'PIX'

  // Create or refund a Payment to keep cashflow/DRE in sync
  if (parsed.data.paid) {
    // Paying an installment → create a Payment
    await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: installment.amount,
        method,
        paidAt: new Date(),
        notes: `Parcela ${(installment as unknown as { number: number }).number}`,
        updatedAt: new Date(),
      } as never,
    })
  } else if (installment.paidAt) {
    // Unmarking a paid installment → create a refund Payment
    await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: installment.amount,
        method: (installment as unknown as { method: string | null }).method ?? 'PIX',
        paidAt: new Date(),
        isRefund: true,
        notes: `Estorno parcela ${(installment as unknown as { number: number }).number}`,
        updatedAt: new Date(),
      } as never,
    })
  }

  // Recalculate Invoice status after payment change
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (invoice) {
    const allPayments = await prisma.payment.findMany({ where: { invoiceId: id } })
    const paidSum = allPayments.filter((p) => !p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
    const refundSum = allPayments.filter((p) => p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
    const netPaid = paidSum - refundSum
    const totalAmount = Number(invoice.totalAmount)
    const currentStatus = invoice.status as string

    if (netPaid >= totalAmount && currentStatus !== 'PAID') {
      // Mark invoice PAID
      await prisma.invoice.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date(), updatedAt: new Date() } as never,
      })
      // Update linked appointments
      await prisma.appointment.updateMany({
        where: { invoiceId: id },
        data: { paymentStatus: 'PAID', updatedAt: new Date() } as never,
      })
      await prisma.financialAuditLog.create({
        data: {
          entityType: 'Invoice',
          entityId: id,
          action: 'STATUS_CHANGE',
          oldValue: { status: currentStatus },
          newValue: { status: 'PAID' },
          changedBy: session.user.id,
          changedAt: new Date(),
        } as never,
      })
    } else if (netPaid < totalAmount && currentStatus === 'PAID') {
      // Revert to OPEN if overpaid is now partial (e.g. installment unmarked)
      await prisma.invoice.update({
        where: { id },
        data: { status: 'OPEN', paidAt: null, updatedAt: new Date() } as never,
      })
      await prisma.appointment.updateMany({
        where: { invoiceId: id },
        data: { paymentStatus: 'PENDING', updatedAt: new Date() } as never,
      })
      await prisma.financialAuditLog.create({
        data: {
          entityType: 'Invoice',
          entityId: id,
          action: 'STATUS_CHANGE',
          oldValue: { status: 'PAID' },
          newValue: { status: 'OPEN' },
          changedBy: session.user.id,
          changedAt: new Date(),
        } as never,
      })
    }
  }

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Installment',
      entityId: installmentId,
      action: 'STATUS_CHANGE',
      oldValue: { paidAt: installment.paidAt, method: (installment as unknown as { method: string | null }).method },
      newValue: { paidAt: updated.paidAt, method: updated.method },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ ...updated, amount: Number(updated.amount) })
}
