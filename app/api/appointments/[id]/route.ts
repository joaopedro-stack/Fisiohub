import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { format } from 'date-fns'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const prisma = getTenantPrisma(slug)
  
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      physiotherapist: { select: { id: true, name: true, email: true, role: true } },
      session: true,
    },
  })
  
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(appointment)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const body = await req.json()
  const prisma = getTenantPrisma(slug)

  // PHYSIOTHERAPIST cannot change who attends
  if (session.user.role === 'PHYSIOTHERAPIST') {
    delete body.physiotherapistId
  }

  // Conflict checks when time or participants are being updated
  if (body.startTime && body.endTime) {
    const newStartTime = new Date(body.startTime)
    const newEndTime = new Date(body.endTime)

    // Physiotherapist conflict check
    if (body.physiotherapistId) {
      const physioConflict = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          physiotherapistId: body.physiotherapistId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [{ startTime: { lt: newEndTime } }, { endTime: { gt: newStartTime } }],
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
    }

    // Room conflict check
    if (body.roomId) {
      const roomConflict = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          roomId: body.roomId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [{ startTime: { lt: newEndTime } }, { endTime: { gt: newStartTime } }],
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
  }

  // Fetch current state before update (needed for finance logic)
  const currentAppointment = await prisma.appointment.findUnique({ where: { id } })

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      updatedAt: new Date(),
    },
    include: { patient: true, physiotherapist: { select: { id: true, name: true, email: true, role: true } } },
  })

  // Finance: react to paymentStatus or status changes
  const prevPaymentStatus = (currentAppointment as unknown as { paymentStatus: string } | null)?.paymentStatus
  const newPaymentStatus: string | undefined = body.paymentStatus
  const newStatus: string | undefined = body.status
  const appt = appointment as unknown as { patientId: string; paymentValue: number | null; paymentMethod: string | null; invoiceId: string | null }

  if (newPaymentStatus && newPaymentStatus !== prevPaymentStatus) {
    if (newPaymentStatus === 'PAID') {
      const amount = Number(body.paymentValue ?? appt.paymentValue)
      const method = body.paymentMethod ?? appt.paymentMethod
      if (amount > 0 && method) {
        try {
          const { createAppointmentPayment } = await import('@/lib/finance/create-appointment-payment')
          await createAppointmentPayment(prisma, id, { amount, method }, session.user.id)
        } catch (finErr) {
          console.error('[Finance] Failed to create payment on PATCH:', finErr)
        }
      }
    } else if (newPaymentStatus === 'INSURANCE') {
      const amount = Number(body.paymentValue ?? appt.paymentValue)
      if (amount > 0) {
        try {
          const { createInsuranceInvoice } = await import('@/lib/finance/create-appointment-payment')
          await createInsuranceInvoice(prisma, id, { amount, patientId: appt.patientId }, session.user.id)
        } catch (finErr) {
          console.error('[Finance] Failed to create insurance invoice on PATCH:', finErr)
        }
      }
    } else if (newPaymentStatus === 'WAIVED') {
      try {
        const { createWaivedInvoice } = await import('@/lib/finance/create-appointment-payment')
        await createWaivedInvoice(prisma, id, appt.patientId, session.user.id)
      } catch (finErr) {
        console.error('[Finance] Failed to create waived invoice on PATCH:', finErr)
      }
    }
  }

  // Auto-cancel open invoice when appointment is cancelled
  if (newStatus === 'CANCELLED' && appt.invoiceId) {
    try {
      const inv = await prisma.invoice.findUnique({ where: { id: appt.invoiceId } })
      if (inv && (inv.status as string) === 'OPEN') {
        await prisma.invoice.update({
          where: { id: appt.invoiceId },
          data: { status: 'CANCELED', updatedAt: new Date() } as never,
        })
        await prisma.financialAuditLog.create({
          data: {
            entityType: 'Invoice',
            entityId: appt.invoiceId,
            action: 'STATUS_CHANGE',
            oldValue: { status: 'OPEN' },
            newValue: { status: 'CANCELED', reason: 'appointment_cancelled' },
            changedBy: session.user.id,
            changedAt: new Date(),
          } as never,
        })
      }
    } catch (finErr) {
      console.error('[Finance] Failed to cancel invoice on appointment cancel:', finErr)
    }
  }

  // Send notifications on status changes (silent — does not block response)
  if (newStatus === 'CONFIRMED' || newStatus === 'CANCELLED') {
    const { prisma: publicPrisma } = await import('@/lib/prisma')
    const clinic = await publicPrisma.clinic.findUnique({ where: { slug } })
    const clinicName = clinic?.name ?? slug
    const notifParams = {
      patientName: appointment.patient.name,
      physiotherapistName: appointment.physiotherapist.name,
      startTime: appointment.startTime,
      clinicName,
    }

    // Email
    try {
      if (appointment.patient.email) {
        const { sendAppointmentConfirmation, sendAppointmentCancellation } = await import('@/lib/email')
        if (newStatus === 'CONFIRMED') {
          await sendAppointmentConfirmation({ ...notifParams, to: appointment.patient.email, type: appointment.type })
        } else {
          await sendAppointmentCancellation({ ...notifParams, to: appointment.patient.email })
        }
      }
    } catch {
      // email failure is non-blocking
    }

    // WhatsApp
    try {
      if (appointment.patient.phone) {
        const { sendAppointmentCancellationWhatsApp } = await import('@/lib/whatsapp')
        if (newStatus === 'CANCELLED') {
          await sendAppointmentCancellationWhatsApp({ ...notifParams, to: appointment.patient.phone })
        }
        // CONFIRMED is handled via the action link (patient already clicked confirm)
      }
    } catch {
      // WhatsApp failure is non-blocking
    }
  }

  return NextResponse.json(appointment)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  await prisma.appointment.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
