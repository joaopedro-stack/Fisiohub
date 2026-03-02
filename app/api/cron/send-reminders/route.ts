import { NextRequest, NextResponse } from 'next/server'
import { prisma as publicPrisma } from '@/lib/prisma'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { sendAppointmentReminder } from '@/lib/email'
import { sendAppointmentReminderWhatsApp } from '@/lib/whatsapp'
import { addHours } from 'date-fns'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = addHours(now, 23)
  const windowEnd = addHours(now, 25)

  let sent = 0
  let errors = 0

  try {
    // Get all active clinics from public schema
    const clinics = await publicPrisma.clinic.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
    })

    for (const clinic of clinics) {
      try {
        const prisma = getTenantPrisma(clinic.slug)

        const appointments = await prisma.appointment.findMany({
          where: {
            startTime: { gte: windowStart, lte: windowEnd },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          include: {
            patient: { select: { name: true, email: true, phone: true } },
            physiotherapist: { select: { name: true } },
          },
        })

        for (const appointment of appointments) {
          const notifParams = {
            patientName: appointment.patient.name,
            physiotherapistName: appointment.physiotherapist.name,
            startTime: appointment.startTime,
            clinicName: clinic.name,
          }

          // Email reminder
          if (appointment.patient.email) {
            try {
              await sendAppointmentReminder({ ...notifParams, to: appointment.patient.email })
              sent++
            } catch (err) {
              console.error(`[Email] Reminder failed for appointment ${appointment.id}:`, err)
              errors++
            }
          }

          // WhatsApp reminder
          if (appointment.patient.phone) {
            try {
              await sendAppointmentReminderWhatsApp({ ...notifParams, to: appointment.patient.phone })
              sent++
            } catch (err) {
              console.error(`[WhatsApp] Reminder failed for appointment ${appointment.id}:`, err)
              errors++
            }
          }
        }
      } catch (err) {
        console.error(`[Cron] Failed to process tenant ${clinic.slug}:`, err)
        errors++
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to query clinics', detail: String(err) }, { status: 500 })
  }

  return NextResponse.json({ sent, errors, windowStart, windowEnd })
}
