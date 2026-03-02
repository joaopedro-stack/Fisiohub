import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const today = new Date()

  const { searchParams } = new URL(req.url)
  const physiotherapistId = searchParams.get('physiotherapistId')

  // Physiotherapist-specific stats
  if (physiotherapistId) {
    const weekStart = startOfWeek(today, { locale: ptBR })
    const weekEnd = endOfWeek(today, { locale: ptBR })

    const [appointmentsToday, appointmentsThisWeek, completedSessions, uniquePatientRows] =
      await Promise.all([
        prisma.appointment.count({
          where: {
            physiotherapistId,
            startTime: { gte: startOfDay(today), lte: endOfDay(today) },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          } as never,
        }),
        prisma.appointment.count({
          where: {
            physiotherapistId,
            startTime: { gte: startOfDay(weekStart), lte: endOfDay(weekEnd) },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          } as never,
        }),
        prisma.session.count({ where: { physiotherapistId } }),
        prisma.appointment.findMany({
          where: { physiotherapistId },
          select: { patientId: true },
          distinct: ['patientId'],
        }),
      ])

    return NextResponse.json({
      appointmentsToday,
      appointmentsThisWeek,
      completedSessions,
      uniquePatients: uniquePatientRows.length,
    })
  }

  // Admin stats
  const [appointmentsToday, activePatients, completedSessions, physiotherapists, revenueResult] = await Promise.all([
    prisma.appointment.count({
      where: {
        startTime: { gte: startOfDay(today), lte: endOfDay(today) },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.patient.count({ where: { isActive: true } }),
    prisma.session.count(),
    prisma.user.count({ where: { role: 'PHYSIOTHERAPIST', isActive: true } }),
    prisma.appointment.aggregate({
      _sum: { paymentValue: true },
      where: { paymentStatus: 'PAID' } as never,
    }),
  ])

  const revenueTotal = Number(revenueResult._sum.paymentValue ?? 0)

  return NextResponse.json({ appointmentsToday, activePatients, completedSessions, physiotherapists, revenueTotal })
}
