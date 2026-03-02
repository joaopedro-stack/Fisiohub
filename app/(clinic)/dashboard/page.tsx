import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, ClipboardList, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PhysiotherapistDashboard } from '@/components/dashboard/physiotherapist-dashboard'

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
  NO_SHOW: 'outline',
}

export default async function DashboardPage() {
  const session = await auth()
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug') ?? session?.user.clinicSlug ?? ''

  if (session?.user.role === 'PHYSIOTHERAPIST') {
    return (
      <PhysiotherapistDashboard
        userId={session.user.id}
        userName={session.user.name}
      />
    )
  }

  return <AdminDashboard slug={slug} />
}

async function AdminDashboard({ slug }: { slug: string }) {
  let stats = { appointmentsToday: 0, activePatients: 0, completedSessions: 0, physiotherapists: 0, revenueTotal: 0 }
  let todayAppointments: Array<{
    id: string
    startTime: Date
    status: string
    patient?: { name: string } | null
    physiotherapist?: { name: string } | null
  }> = []

  try {
    const prisma = getTenantPrisma(slug)
    const today = new Date()

    const [apptToday, activePatients, completedSessions, physiotherapists, todayAppts, revenueResult] =
      await Promise.all([
        prisma.appointment.count({
          where: {
            startTime: { gte: startOfDay(today), lte: endOfDay(today) },
            status: { not: 'CANCELLED' },
          },
        }),
        prisma.patient.count({ where: { isActive: true } }),
        prisma.session.count(),
        prisma.user.count({ where: { role: 'PHYSIOTHERAPIST', isActive: true } }),
        prisma.appointment.findMany({
          where: {
            startTime: { gte: startOfDay(today), lte: endOfDay(today) },
            status: { not: 'CANCELLED' },
          },
          include: {
            patient: { select: { name: true } },
            physiotherapist: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
          take: 8,
        }),
        prisma.appointment.aggregate({
          _sum: { paymentValue: true },
          where: { paymentStatus: 'PAID' } as never,
        }),
      ])

    stats = {
      appointmentsToday: apptToday,
      activePatients,
      completedSessions,
      physiotherapists,
      revenueTotal: Number(revenueResult._sum.paymentValue ?? 0),
    }
    todayAppointments = todayAppts
  } catch {
    // DB not available yet
  }

  const revenueFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenueTotal)

  const kpis = [
    {
      label: 'Agendamentos Hoje',
      value: String(stats.appointmentsToday),
      icon: Calendar,
      href: '/appointments',
      color: 'text-blue-600',
    },
    {
      label: 'Pacientes Ativos',
      value: String(stats.activePatients),
      icon: Users,
      href: '/patients',
      color: 'text-green-600',
    },
    {
      label: 'Sessões Registradas',
      value: String(stats.completedSessions),
      icon: ClipboardList,
      href: '/sessions',
      color: 'text-purple-600',
    },
    {
      label: 'Receita Total',
      value: revenueFormatted,
      icon: DollarSign,
      href: '/relatorios',
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {formatDate(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum agendamento para hoje
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{appt.patient?.name ?? 'Paciente'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(appt.startTime, 'HH:mm')} —{' '}
                      {appt.physiotherapist?.name ?? 'Fisioterapeuta'}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[appt.status] ?? 'outline'}>
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
