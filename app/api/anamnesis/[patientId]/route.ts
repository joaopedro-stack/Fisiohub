import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const anamnesisSchema = z.object({
  chiefComplaint: z.string().optional().nullable(),
  history:        z.string().optional().nullable(),
  medications:    z.string().optional().nullable(),
  allergies:      z.string().optional().nullable(),
  surgeries:      z.string().optional().nullable(),
  familyHistory:  z.string().optional().nullable(),
  lifestyle:      z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { patientId } = await params
  const prisma = getTenantPrisma(slug)

  const anamnesis = await prisma.anamnesis.findUnique({ where: { patientId } })
  return NextResponse.json(anamnesis)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { patientId } = await params
  const body = await req.json()
  const parsed = anamnesisSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({
    createId: () => Math.random().toString(36).slice(2),
  }))

  const anamnesis = await prisma.anamnesis.upsert({
    where: { patientId },
    create: {
      id: createId(),
      patientId,
      ...parsed.data,
      updatedAt: new Date(),
    },
    update: {
      ...parsed.data,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(anamnesis)
}
