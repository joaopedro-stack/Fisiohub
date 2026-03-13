import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']).optional(),
  price: z.number().min(0),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const entries = await prisma.priceTable.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(
    entries.map((e) => ({ ...e, price: Number(e.price) }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)
  const entry = await prisma.priceTable.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type ?? null,
      price: parsed.data.price,
    } as never,
  })

  await prisma.financialAuditLog.create({
    data: {
      entityType: 'PriceTable',
      entityId: entry.id,
      action: 'CREATE',
      newValue: { name: entry.name, price: Number(entry.price), type: entry.type },
      changedBy: session.user.id,
      changedAt: new Date(),
    } as never,
  })

  return NextResponse.json({ ...entry, price: Number(entry.price) }, { status: 201 })
}
