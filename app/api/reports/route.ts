import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const prisma = getTenantPrisma(slug)
  const today = new Date()

  // Build monthly buckets for Jan→Dec of the requested year (default: current year)
  const year = parseInt(searchParams.get('year') ?? String(today.getFullYear()), 10)
  const monthBuckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1)
    return {
      month: format(d, 'MMM', { locale: ptBR }),
      monthFull: format(d, 'MMMM', { locale: ptBR }),
      year,
      monthNum: i + 1,
      from: startOfMonth(d),
      to: endOfMonth(d),
    }
  })

  // Fetch all appointments in the range
  const from = monthBuckets[0].from
  const to = monthBuckets[monthBuckets.length - 1].to

  const [appointments, activePatientsCount, physioCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { startTime: { gte: from, lte: to } },
      select: {
        id: true,
        startTime: true,
        status: true,
        paymentStatus: true,
        paymentValue: true,
        physiotherapistId: true,
        physiotherapist: { select: { id: true, name: true } },
      },
    }),
    prisma.patient.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'PHYSIOTHERAPIST', isActive: true } }),
  ])

  // Monthly stats
  const monthlyStats = monthBuckets.map((bucket) => {
    const appts = appointments.filter((a) => {
      const d = new Date(a.startTime)
      return d >= bucket.from && d <= bucket.to
    })
    const scheduled = appts.filter((a) => a.status === 'SCHEDULED').length
    const confirmed = appts.filter((a) => a.status === 'CONFIRMED').length
    const completed = appts.filter((a) => a.status === 'COMPLETED').length
    const cancelled = appts.filter((a) => a.status === 'CANCELLED').length
    const noShow = appts.filter((a) => a.status === 'NO_SHOW').length
    const revenue = appts
      .filter((a) => (a.paymentStatus as string) === 'PAID')
      .reduce((sum, a) => sum + Number(a.paymentValue ?? 0), 0)

    return {
      month: bucket.month,
      monthFull: bucket.monthFull,
      total: appts.length,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      revenue,
    }
  })

  // Status distribution (all time in range)
  const statusDist: Record<string, number> = {}
  for (const a of appointments) {
    statusDist[a.status] = (statusDist[a.status] ?? 0) + 1
  }

  // Top physiotherapists (in range)
  const physioMap: Record<string, { name: string; count: number; completed: number }> = {}
  for (const a of appointments) {
    const id = a.physiotherapistId
    const name = (a.physiotherapist as { name: string } | null)?.name ?? 'Desconhecido'
    if (!physioMap[id]) physioMap[id] = { name, count: 0, completed: 0 }
    physioMap[id].count++
    if (a.status === 'COMPLETED') physioMap[id].completed++
  }
  const topPhysios = Object.values(physioMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Revenue totals
  const revenueTotal = appointments
    .filter((a) => (a.paymentStatus as string) === 'PAID')
    .reduce((sum, a) => sum + Number(a.paymentValue ?? 0), 0)

  const pendingRevenue = appointments
    .filter((a) => (a.paymentStatus as string) === 'PENDING')
    .reduce((sum, a) => sum + Number(a.paymentValue ?? 0), 0)

  return NextResponse.json({
    monthlyStats,
    statusDistribution: statusDist,
    topPhysiotherapists: topPhysios,
    revenueTotal,
    pendingRevenue,
    activePatientsCount,
    physioCount,
    totalInPeriod: appointments.length,
  })
}
