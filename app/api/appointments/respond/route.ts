import { NextRequest, NextResponse } from 'next/server'
import { verifyAppointmentToken } from '@/lib/appointment-token'
import { getTenantPrisma } from '@/lib/tenant-prisma'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const token = searchParams.get('token')
  const action = searchParams.get('action')

  const base = `${origin}/agendamento/resposta`

  if (!token || !action || !['confirm', 'cancel'].includes(action)) {
    return NextResponse.redirect(`${base}?status=invalid`)
  }

  try {
    const { appointmentId, clinicSlug } = await verifyAppointmentToken(token)
    const prisma = getTenantPrisma(clinicSlug)

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: { select: { name: true } } },
    })

    if (!appointment) {
      return NextResponse.redirect(`${base}?status=not_found`)
    }

    // Already processed
    if (appointment.status === 'COMPLETED') {
      return NextResponse.redirect(`${base}?status=already_completed`)
    }

    if (action === 'confirm') {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED', updatedAt: new Date() },
      })
      return NextResponse.redirect(`${base}?status=confirmed`)
    } else {
      await prisma.appointment.delete({ where: { id: appointmentId } })
      return NextResponse.redirect(`${base}?status=cancelled`)
    }
  } catch {
    return NextResponse.redirect(`${base}?status=error`)
  }
}
