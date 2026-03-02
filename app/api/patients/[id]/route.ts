import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const prisma = getTenantPrisma(slug)
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { physiotherapist: true },
        orderBy: { startTime: 'desc' },
        take: 10,
      },
      sessions: {
        include: { physiotherapist: true },
        orderBy: { startTime: 'desc' },
        take: 10,
      },
      anamnesis: true,
    },
  })

  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (session.user.role === 'PHYSIOTHERAPIST' && (patient as any).physiotherapistId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(patient)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const prisma = getTenantPrisma(slug)

  if (session.user.role === 'PHYSIOTHERAPIST') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await prisma.patient.findUnique({ where: { id } }) as any
    if (!existing || existing.physiotherapistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...body,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(patient)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  if (session.user.role === 'PHYSIOTHERAPIST') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await prisma.patient.findUnique({ where: { id } }) as any
    if (!existing || existing.physiotherapistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await prisma.patient.update({
    where: { id },
    data: { isActive: false, updatedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
