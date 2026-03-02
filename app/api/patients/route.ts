import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const createPatientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  healthInsurance: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  physiotherapistId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const physiotherapistIdFilter = searchParams.get('physiotherapistId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const prisma = getTenantPrisma(slug)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search } },
          { phone: { contains: search } },
        ],
        isActive: true,
      }
    : { isActive: true }

  if (session.user.role === 'PHYSIOTHERAPIST') {
    where.physiotherapistId = session.user.id
  } else if (physiotherapistIdFilter) {
    where.physiotherapistId = physiotherapistIdFilter
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        physiotherapist: { select: { id: true, name: true } },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return NextResponse.json({ patients, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const body = await req.json()
  const parsed = createPatientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  
  const prisma = getTenantPrisma(slug)
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => Math.random().toString(36).slice(2) }))
  
  // PHYSIOTHERAPIST always owns the patient; ADMIN/RECEPTIONIST use the provided value
  const physiotherapistId =
    session.user.role === 'PHYSIOTHERAPIST'
      ? session.user.id
      : (parsed.data.physiotherapistId ?? null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { physiotherapistId: _pid, ...patientData } = parsed.data
  const patient = await prisma.patient.create({
    data: {
      ...patientData,
      id: createId(),
      email: patientData.email || null,
      birthDate: patientData.birthDate ? new Date(patientData.birthDate) : null,
      updatedAt: new Date(),
      ...(physiotherapistId && { physiotherapistId }),
    } as any,
  })
  
  return NextResponse.json(patient, { status: 201 })
}
