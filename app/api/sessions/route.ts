import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const createSessionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  physiotherapistId: z.string(),
  sessionNumber: z.number().default(1),
  techniques: z.array(z.string()).default([]),
  notes: z.string().optional(),
  evolution: z.string().optional(),
  painLevel: z.number().min(0).max(10).optional(),
  startTime: z.string(),
  endTime: z.string(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  const physiotherapistId = searchParams.get('physiotherapistId')
  
  const prisma = getTenantPrisma(slug)
  
  const appointmentId = searchParams.get('appointmentId')

  const where: Record<string, unknown> = {}
  if (patientId) where.patientId = patientId
  if (physiotherapistId) where.physiotherapistId = physiotherapistId
  if (appointmentId) where.appointmentId = appointmentId
  
  const sessions = await prisma.session.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true } },
      physiotherapist: { select: { id: true, name: true } },
      appointment: { select: { id: true, type: true, status: true } },
    },
    orderBy: { startTime: 'desc' },
  })
  
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const body = await req.json()
  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  
  const prisma = getTenantPrisma(slug)
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => Math.random().toString(36).slice(2) }))
  
  const clinicalSession = await prisma.session.create({
    data: {
      ...parsed.data,
      id: createId(),
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      updatedAt: new Date(),
    },
    include: {
      patient: { select: { id: true, name: true } },
      physiotherapist: { select: { id: true, name: true } },
    },
  })
  
  // Update appointment status to COMPLETED
  await prisma.appointment.update({
    where: { id: parsed.data.appointmentId },
    data: { status: 'COMPLETED', updatedAt: new Date() },
  })
  
  return NextResponse.json(clinicalSession, { status: 201 })
}
