import { NextRequest, NextResponse } from 'next/server'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'
import { startOfDay, endOfDay, format } from 'date-fns'

const bookingSchema = z.object({
  patientName: z.string().min(2, 'Nome obrigatório'),
  patientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  patientPhone: z.string().min(8, 'Telefone obrigatório'),
  physiotherapistId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']).default('INITIAL_EVALUATION'),
  notes: z.string().optional(),
})

/** GET: returns available slots + physiotherapists for public booking */
export async function GET(req: NextRequest) {
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const physiotherapistId = searchParams.get('physiotherapistId')

  const prisma = getTenantPrisma(slug)

  // Always return physiotherapists
  const physiotherapists = await prisma.user.findMany({
    where: { role: { in: ['PHYSIOTHERAPIST', 'ADMIN'] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  if (!date || !physiotherapistId) {
    return NextResponse.json({ physiotherapists, slots: [] })
  }

  // Fetch clinic settings
  const settings = await prisma.clinicSettings.findFirst()
  const openingTime = settings?.openingTime ?? '08:00'
  const closingTime = settings?.closingTime ?? '18:00'
  const duration = settings?.sessionDuration ?? 60

  // Fetch existing appointments for the physio on that date
  const d = new Date(date + 'T00:00:00')
  const booked = await prisma.appointment.findMany({
    where: {
      physiotherapistId,
      startTime: { gte: startOfDay(d), lte: endOfDay(d) },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { startTime: true, endTime: true },
  })

  // Generate all slots
  const [oh, om] = openingTime.split(':').map(Number)
  const [ch, cm] = closingTime.split(':').map(Number)
  const allSlots: string[] = []
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur + duration <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    cur += duration
  }

  // Filter out booked slots
  const availableSlots = allSlots.filter((slot) => {
    const [sh, sm] = slot.split(':').map(Number)
    const slotStart = sh * 60 + sm
    const slotEnd = slotStart + duration
    return !booked.some((b) => {
      const bs = new Date(b.startTime)
      const be = new Date(b.endTime)
      const bStart = bs.getHours() * 60 + bs.getMinutes()
      const bEnd = be.getHours() * 60 + be.getMinutes()
      return bStart < slotEnd && bEnd > slotStart
    })
  }).map((slot) => {
    const [sh, sm] = slot.split(':').map(Number)
    const endMin = sh * 60 + sm + duration
    return {
      start: slot,
      end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
    }
  })

  return NextResponse.json({ physiotherapists, slots: availableSlots, duration })
}

/** POST: create appointment from public booking (creates patient if new) */
export async function POST(req: NextRequest) {
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 400 })

  const body = await req.json()
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({
    createId: () => Math.random().toString(36).slice(2),
  }))

  const { patientName, patientEmail, patientPhone, physiotherapistId, date, startTime, endTime, type, notes } = parsed.data

  const start = new Date(`${date}T${startTime}:00`)
  const end = new Date(`${date}T${endTime}:00`)

  // Conflict check
  const conflict = await prisma.appointment.findFirst({
    where: {
      physiotherapistId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    } as never,
  })
  if (conflict) {
    return NextResponse.json(
      { error: `Horário das ${format(new Date(conflict.startTime), 'HH:mm')} às ${format(new Date(conflict.endTime), 'HH:mm')} já está ocupado` },
      { status: 409 }
    )
  }

  // Find or create patient by phone
  let patient = await prisma.patient.findFirst({ where: { phone: patientPhone } })
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        id: createId(),
        name: patientName,
        phone: patientPhone,
        email: patientEmail || null,
        updatedAt: new Date(),
      },
    })
  }

  const appointment = await prisma.appointment.create({
    data: {
      id: createId(),
      patientId: patient.id,
      physiotherapistId,
      startTime: start,
      endTime: end,
      type,
      notes,
      status: 'SCHEDULED',
      updatedAt: new Date(),
    },
    include: {
      patient: { select: { id: true, name: true } },
      physiotherapist: { select: { id: true, name: true } },
    },
  })

  // Send confirmation email (silent — does not block response)
  try {
    const emailTo = patientEmail || patient.email
    if (emailTo) {
      const { prisma: publicPrisma } = await import('@/lib/prisma')
      const { sendAppointmentConfirmation } = await import('@/lib/email')
      const clinic = await publicPrisma.clinic.findUnique({ where: { slug } })
      await sendAppointmentConfirmation({
        to: emailTo,
        patientName: appointment.patient.name,
        physiotherapistName: appointment.physiotherapist.name,
        startTime: appointment.startTime,
        clinicName: clinic?.name ?? slug,
        type: appointment.type,
      })
    }
  } catch {
    // email failure is non-blocking
  }

  return NextResponse.json(appointment, { status: 201 })
}
