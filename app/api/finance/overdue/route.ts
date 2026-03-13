import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const now = new Date()

  // Auto-mark OPEN invoices past dueDate as OVERDUE
  await prisma.invoice.updateMany({
    where: {
      status: 'OPEN',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' } as never,
  })

  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: 'OVERDUE' },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      payments: { select: { amount: true, isRefund: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const result = overdueInvoices.map((inv) => {
    const paidSum = inv.payments
      .filter((p) => !p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const refundSum = inv.payments
      .filter((p) => p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const netPaid = paidSum - refundSum
    const outstanding = Number(inv.totalAmount) - netPaid
    const dueDate = inv.dueDate!
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      invoiceId: inv.id,
      patient: inv.patient,
      totalAmount: Number(inv.totalAmount),
      netPaid,
      outstanding,
      dueDate: inv.dueDate,
      daysOverdue,
    }
  })

  // Sort by daysOverdue descending
  result.sort((a, b) => b.daysOverdue - a.daysOverdue)

  return NextResponse.json(result)
}
