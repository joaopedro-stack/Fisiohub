import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoiceId = (appointment as unknown as { invoiceId: string | null }).invoiceId
  if (!invoiceId) return NextResponse.json({ error: 'No invoice linked' }, { status: 404 })

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: { orderBy: { paidAt: 'asc' } },
      installments: { orderBy: { number: 'asc' } },
    },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const paidSum = invoice.payments.filter((p) => !p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
  const refundSum = invoice.payments.filter((p) => p.isRefund).reduce((s, p) => s + Number(p.amount), 0)
  const netPaid = paidSum - refundSum

  return NextResponse.json({
    ...invoice,
    totalAmount: Number(invoice.totalAmount),
    netPaid,
    installments: invoice.installments.map((inst) => ({ ...inst, amount: Number(inst.amount) })),
  })
}
