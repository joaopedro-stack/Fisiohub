import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'
import { startOfDay, endOfDay, format } from 'date-fns'

const createAppointmentSchema = z.object({
  patientId: z.string(),
  physiotherapistId: z.string(),
  roomId: z.string().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']).default('FOLLOW_UP'),
  notes: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'INSURANCE', 'WAIVED']).default('PENDING'),
  paymentMethod: z.enum(['CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER']).optional().nullable(),
  paymentValue: z.number().positive().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const physiotherapistId = searchParams.get('physiotherapistId')
  const patientId = searchParams.get('patientId')

  const prisma = getTenantPrisma(slug)
  const where: Record<string, unknown> = {}

  if (from && to) {
    // Append T00:00:00 so the string is parsed as LOCAL time, not UTC midnight
    where.startTime = { gte: startOfDay(new Date(from + 'T00:00:00')), lte: endOfDay(new Date(to + 'T00:00:00')) }
  } else if (date) {
    const d = new Date(date + 'T00:00:00')
    where.startTime = { gte: startOfDay(d), lte: endOfDay(d) }
  }

  if (physiotherapistId) where.physiotherapistId = physiotherapistId
  if (patientId) where.patientId = patientId

  const roomId = searchParams.get('roomId')
  if (roomId) where.roomId = roomId

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      physiotherapist: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const body = await req.json()
  const parsed = createAppointmentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const prisma = getTenantPrisma(slug)

  // PHYSIOTHERAPIST always attends their own appointments
  if (session.user.role === 'PHYSIOTHERAPIST') {
    parsed.data.physiotherapistId = session.user.id
  }

  const startTime = new Date(parsed.data.startTime)
  const endTime = new Date(parsed.data.endTime)

  // Physiotherapist conflict check
  const physioConflict = await prisma.appointment.findFirst({
    where: {
      physiotherapistId: parsed.data.physiotherapistId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    } as never,
  })
  if (physioConflict) {
    return NextResponse.json(
      {
        error: `Conflito de agenda: o fisioterapeuta já possui um agendamento das ${format(new Date(physioConflict.startTime), 'HH:mm')} às ${format(new Date(physioConflict.endTime), 'HH:mm')} neste horário`,
      },
      { status: 409 }
    )
  }

  // Room conflict check
  if (parsed.data.roomId) {
    const roomConflict = await prisma.appointment.findFirst({
      where: {
        roomId: parsed.data.roomId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      } as never,
    })
    if (roomConflict) {
      return NextResponse.json(
        {
          error: `Conflito de sala: já existe um agendamento das ${format(new Date(roomConflict.startTime), 'HH:mm')} às ${format(new Date(roomConflict.endTime), 'HH:mm')} nesta sala`,
        },
        { status: 409 }
      )
    }
  }

  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({
    createId: () => Math.random().toString(36).slice(2),
  }))

  const appointment = await prisma.appointment.create({
    data: {
      ...parsed.data,
      id: createId(),
      startTime,
      endTime,
      updatedAt: new Date(),
    },
    include: {
      patient: true,
      physiotherapist: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  // Send email with confirm/cancel buttons (silent — does not block response)
  try {
    if (appointment.patient.email) {
      const { prisma: publicPrisma } = await import('@/lib/prisma')
      const clinic = await publicPrisma.clinic.findUnique({ where: { slug } })
      const clinicName = clinic?.name ?? slug

      const { signAppointmentToken } = await import('@/lib/appointment-token')
      const { sendAppointmentActionRequest } = await import('@/lib/email')

      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? `https://${slug}.fisiohub.com.br`
          : (process.env.NEXTAUTH_URL ?? 'http://localhost:3000')

      const token = await signAppointmentToken(appointment.id, slug)
      await sendAppointmentActionRequest({
        to: appointment.patient.email,
        patientName: appointment.patient.name,
        physiotherapistName: appointment.physiotherapist.name,
        startTime: appointment.startTime,
        clinicName,
        type: appointment.type,
        confirmUrl: `${baseUrl}/api/appointments/respond?token=${token}&action=confirm`,
        cancelUrl: `${baseUrl}/api/appointments/respond?token=${token}&action=cancel`,
      })
    }
  } catch (emailErr) {
    console.error('[Email] Failed to send appointment email:', emailErr)
  }

  // Send WhatsApp with confirm/cancel links (silent — does not block response)
  try {
    if (appointment.patient.phone) {
      const { signAppointmentToken } = await import('@/lib/appointment-token')
      const { sendAppointmentWhatsApp } = await import('@/lib/whatsapp')
      const { prisma: publicPrisma } = await import('@/lib/prisma')
      const clinic = await publicPrisma.clinic.findUnique({ where: { slug } })
      const clinicName = clinic?.name ?? slug

      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? `https://${slug}.fisiohub.com.br`
          : (process.env.NEXTAUTH_URL ?? 'http://localhost:3000')

      const token = await signAppointmentToken(appointment.id, slug)
      await sendAppointmentWhatsApp({
        to: appointment.patient.phone,
        patientName: appointment.patient.name,
        physiotherapistName: appointment.physiotherapist.name,
        startTime: appointment.startTime,
        clinicName,
        type: appointment.type,
        confirmUrl: `${baseUrl}/api/appointments/respond?token=${token}&action=confirm`,
        cancelUrl: `${baseUrl}/api/appointments/respond?token=${token}&action=cancel`,
      })
    }
  } catch (waErr) {
    console.error('[WhatsApp] Failed to send appointment message:', waErr)
  }

  return NextResponse.json(appointment, { status: 201 })
}
