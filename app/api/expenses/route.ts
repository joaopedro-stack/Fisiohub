import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const createSchema = z.object({
  description: z.string().min(1),
  category: z.enum(['RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'TAXES', 'OTHER']),
  amount: z.number().positive(),
  dueDate: z.string(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (category) where.category = category
  if (from || to) {
    where.dueDate = {}
    if (from) (where.dueDate as Record<string, unknown>).gte = new Date(from)
    if (to) (where.dueDate as Record<string, unknown>).lte = new Date(to)
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: where as never,
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where: where as never }),
  ])

  return NextResponse.json({
    data: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    total,
    page,
    limit,
  })
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

  const expense = await prisma.expense.create({
    data: {
      description: parsed.data.description,
      category: parsed.data.category,
      amount: parsed.data.amount,
      dueDate: new Date(parsed.data.dueDate),
      isRecurring: parsed.data.isRecurring,
      recurrenceRule: parsed.data.recurrenceRule,
      updatedAt: new Date(),
    } as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'Expense',
      entityId: expense.id,
      action: 'CREATE',
      newValue: { ...expense, amount: Number(expense.amount) },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 })
}
