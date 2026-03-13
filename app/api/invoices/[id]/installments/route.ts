import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'
import { addDays } from 'date-fns'

const createSchema = z.object({
  count: z.number().int().min(2).max(60),
  startDate: z.string(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(prisma: unknown) { return prisma as any }

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

  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const installments = await db(prisma).installment.findMany({
    where: { invoiceId: id },
    orderBy: { number: 'asc' },
  })

  return NextResponse.json(
    installments.map((inst: { amount: number }) => ({ ...inst, amount: Number(inst.amount) }))
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((invoice.status as string) === 'CANCELED') {
    return NextResponse.json({ error: 'Cannot create installments for a canceled invoice' }, { status: 409 })
  }

  const { count, startDate } = parsed.data
  const total = Number(invoice.totalAmount)
  const baseAmount = Math.floor((total / count) * 100) / 100
  const lastAmount = Math.round((total - baseAmount * (count - 1)) * 100) / 100
  const start = new Date(startDate)

  // Delete existing installments first
  await db(prisma).installment.deleteMany({ where: { invoiceId: id } })

  const installments = await prisma.$transaction(
    Array.from({ length: count }, (_, i) => {
      const amount = i === count - 1 ? lastAmount : baseAmount
      const dueDate = addDays(start, i * 30)
      return db(prisma).installment.create({
        data: {
          invoiceId: id,
          number: i + 1,
          amount,
          dueDate,
        },
      })
    })
  )

  return NextResponse.json(
    (installments as { amount: number }[]).map((inst) => ({ ...inst, amount: Number(inst.amount) })),
    { status: 201 }
  )
}
