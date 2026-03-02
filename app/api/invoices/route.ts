import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const createSchema = z.object({
  patientId: z.string().min(1),
  totalAmount: z.number().positive(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  isInsurance: z.boolean().default(false),
  insuranceBilledAmount: z.number().optional(),
  insuranceExpectedAmount: z.number().optional(),
  insuranceStatus: z.enum(['BILLED', 'RECEIVED', 'PARTIAL', 'GLOSA']).optional(),
  appointmentIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const patientId = searchParams.get('patientId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (patientId) where.patientId = patientId
  if (from || to) {
    where.issuedAt = {}
    if (from) (where.issuedAt as Record<string, unknown>).gte = new Date(from)
    if (to) (where.issuedAt as Record<string, unknown>).lte = new Date(to)
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: where as never,
      include: {
        patient: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: where as never }),
  ])

  // Compute effective status (OVERDUE if past due and still OPEN)
  const now = new Date()
  const enriched = invoices.map((inv) => {
    const paidSum = inv.payments
      .filter((p) => !p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const refundSum = inv.payments
      .filter((p) => p.isRefund)
      .reduce((s, p) => s + Number(p.amount), 0)
    const netPaid = paidSum - refundSum

    let effectiveStatus = inv.status as string
    if (effectiveStatus === 'OPEN' && inv.dueDate && inv.dueDate < now) {
      effectiveStatus = 'OVERDUE'
    }

    return {
      ...inv,
      totalAmount: Number(inv.totalAmount),
      netPaid,
      effectiveStatus,
    }
  })

  return NextResponse.json({ data: enriched, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)
  const { appointmentIds, ...data } = parsed.data

  const invoice = await prisma.invoice.create({
    data: {
      patientId: data.patientId,
      totalAmount: data.totalAmount,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
      isInsurance: data.isInsurance,
      insuranceBilledAmount: data.insuranceBilledAmount,
      insuranceExpectedAmount: data.insuranceExpectedAmount,
      insuranceStatus: data.insuranceStatus,
      updatedAt: new Date(),
    } as never,
  })

  // Link appointments to this invoice
  if (appointmentIds?.length) {
    await prisma.appointment.updateMany({
      where: { id: { in: appointmentIds } },
      data: { invoiceId: invoice.id, updatedAt: new Date() } as never,
    })
  }

  // Audit log
  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'CREATE',
      newValue: { ...invoice, totalAmount: Number(invoice.totalAmount) },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json(invoice, { status: 201 })
}
