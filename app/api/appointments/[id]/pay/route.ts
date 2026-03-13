import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'
import { createAppointmentPayment } from '@/lib/finance/create-appointment-payment'

const paySchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER']),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const prisma = getTenantPrisma(slug)

  try {
    const result = await createAppointmentPayment(
      prisma,
      id,
      {
        amount: parsed.data.amount,
        method: parsed.data.method,
        notes: parsed.data.notes,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
      },
      session.user.id,
    )
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao registrar pagamento' },
      { status: 400 },
    )
  }
}
