import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

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

  const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoices = await prisma.invoice.findMany({
    where: { patientId: id },
    include: {
      payments: { orderBy: { paidAt: 'asc' } },
      appointments: { select: { id: true } },
      installments: { orderBy: { number: 'asc' } },
    },
    orderBy: { issuedAt: 'desc' },
  })

  const now = new Date()
  let totalBilled = 0
  let totalPaid = 0
  let overdueAmount = 0

  const invoiceList = invoices.map((inv) => {
    const amount = Number(inv.totalAmount)
    totalBilled += amount

    const paidSum = inv.payments
      .filter((p) => !p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const refundSum = inv.payments
      .filter((p) => p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const netPaid = paidSum - refundSum
    totalPaid += netPaid

    let effectiveStatus = inv.status as string
    if (effectiveStatus === 'OPEN' && inv.dueDate && inv.dueDate < now) {
      effectiveStatus = 'OVERDUE'
    }

    if (effectiveStatus === 'OVERDUE') {
      overdueAmount += amount - netPaid
    }

    return {
      id: inv.id,
      totalAmount: amount,
      netPaid,
      status: inv.status,
      effectiveStatus,
      issuedAt: inv.issuedAt,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      notes: inv.notes,
      appointmentsCount: inv.appointments.length,
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt,
        isRefund: p.isRefund,
        notes: p.notes,
      })),
      installments: inv.installments.map((inst) => ({
        id: inst.id,
        number: inst.number,
        amount: Number(inst.amount),
        dueDate: inst.dueDate,
        paidAt: inst.paidAt,
        method: inst.method,
        notes: inst.notes,
      })),
    }
  })

  return NextResponse.json({
    totalBilled,
    totalPaid,
    balance: totalBilled - totalPaid,
    overdueAmount,
    invoices: invoiceList,
  })
}
