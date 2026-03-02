'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  UserX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-dialog'
import { SessionButton } from '@/components/features/sessions/session-button'
import type { Appointment } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

const STATUS_CONFIG: Record<
  string,
  { label: string; border: string; dot: string; badge: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  SCHEDULED: {
    label: 'Agendado',
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
    badge: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    variant: 'default',
  },
  CONFIRMED: {
    label: 'Confirmado',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
    variant: 'default',
  },
  COMPLETED: {
    label: 'Concluído',
    border: 'border-l-muted-foreground/25',
    dot: 'bg-muted-foreground/50',
    badge: 'text-muted-foreground bg-muted',
    variant: 'secondary',
  },
  NO_SHOW: {
    label: 'Não compareceu',
    border: 'border-l-orange-400',
    dot: 'bg-orange-400',
    badge: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
    variant: 'outline',
  },
}

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const WEEK_DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAppointments(params: {
  date?: string
  from?: string
  to?: string
  physiotherapistId: string
}): Promise<Appointment[]> {
  const sp = new URLSearchParams()
  if (params.date) sp.set('date', params.date)
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  sp.set('physiotherapistId', params.physiotherapistId)
  const res = await fetch(`/api/appointments?${sp}`)
  if (!res.ok) throw new Error('Erro ao buscar atendimentos')
  return res.json()
}

async function fetchPhysioStats(physiotherapistId: string) {
  const res = await fetch(`/api/dashboard?physiotherapistId=${physiotherapistId}`)
  if (!res.ok) throw new Error('Erro ao buscar estatísticas')
  return res.json() as Promise<{
    appointmentsToday: number
    appointmentsThisWeek: number
    completedSessions: number
    uniquePatients: number
  }>
}

async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Erro ao atualizar atendimento')
}

// ─── Appointment row ──────────────────────────────────────────────────────────

function AppointmentRow({
  appointment,
  onComplete,
  onNoShow,
  isPending,
}: {
  appointment: Appointment
  onComplete: (id: string) => void
  onNoShow: (id: string) => void
  isPending: boolean
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: deleteAppt, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointments/${appointment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao cancelar')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['physio-stats'] })
      toast.success('Agendamento cancelado')
      setShowCancelConfirm(false)
    },
    onError: () => toast.error('Erro ao cancelar agendamento'),
  })

  const cfg = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.SCHEDULED
  const isTerminal = ['COMPLETED', 'NO_SHOW'].includes(appointment.status)
  const canAct = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status)
  const allPending = isPending || isDeleting

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 border-l-[3px] bg-card',
          cfg.border,
          isTerminal && 'opacity-55'
        )}
      >
        {/* Time */}
        <div className="text-right min-w-[38px] shrink-0">
          <p className="text-xs font-semibold tabular-nums leading-none">
            {format(new Date(appointment.startTime), 'HH:mm')}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
            {format(new Date(appointment.endTime), 'HH:mm')}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">
            {appointment.patient?.name ?? 'Paciente'}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {TYPE_LABELS[appointment.type] ?? appointment.type}
          </p>
        </div>

        {/* Status badge */}
        <Badge variant={cfg.variant} className="hidden sm:flex shrink-0 text-[11px]">
          {cfg.label}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canAct && (
            <>
              {/* Concluir */}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                onClick={() => onComplete(appointment.id)}
                disabled={allPending}
                title="Concluir atendimento"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>

              {/* Não compareceu */}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                onClick={() => onNoShow(appointment.id)}
                disabled={allPending}
                title="Paciente não compareceu"
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Registrar sessão — disponível para agendamentos ativos e concluídos */}
          {appointment.status !== 'NO_SHOW' && (
            <SessionButton
              appointmentId={appointment.id}
              patientId={appointment.patientId}
              physiotherapistId={appointment.physiotherapistId}
              appointmentDate={appointment.startTime}
              patientName={appointment.patient?.name}
            />
          )}

          {/* Cancelar (deleta o agendamento) — apenas para ativos */}
          {canAct && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => setShowCancelConfirm(true)}
              disabled={allPending}
              title="Cancelar agendamento"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirm={() => deleteAppt()}
        isPending={isDeleting}
        title="Cancelar agendamento"
        description={`Tem certeza que deseja cancelar o agendamento de ${appointment.patient?.name ?? 'paciente'}? O registro será removido permanentemente.`}
      />
    </>
  )
}

// ─── Today list ───────────────────────────────────────────────────────────────

function TodayList({ userId }: { userId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const queryClient = useQueryClient()

  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ['appointments', { date: today, physiotherapistId: userId }],
    queryFn: () => fetchAppointments({ date: today, physiotherapistId: userId }),
    retry: 1,
  })

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointmentStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['physio-stats'] })
      toast.success(status === 'COMPLETED' ? 'Atendimento concluído' : 'Paciente marcado como não compareceu')
    },
    onError: () => toast.error('Erro ao atualizar atendimento'),
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <Clock className="h-7 w-7 text-destructive/40" />
        <p className="text-sm text-muted-foreground">Erro ao carregar agendamentos</p>
      </div>
    )
  }

  if (!appointments?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <Clock className="h-7 w-7 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum atendimento hoje</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {appointments.map((appt) => (
        <AppointmentRow
          key={appt.id}
          appointment={appt}
          onComplete={(id) => updateStatus({ id, status: 'COMPLETED' })}
          onNoShow={(id) => updateStatus({ id, status: 'NO_SHOW' })}
          isPending={isPending}
        />
      ))}
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ userId }: { userId: string }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(
    () => format(new Date(), 'yyyy-MM-dd')
  )

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', { from, to, physiotherapistId: userId }],
    queryFn: () => fetchAppointments({ from, to, physiotherapistId: userId }),
  })

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startOffset = getDay(startOfMonth(currentMonth))

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments?.forEach((appt) => {
      const key = format(new Date(appt.startTime), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(appt)
    })
    return map
  }, [appointments])

  const selectedAppts = selectedDay ? (byDay[selectedDay] ?? []) : []
  const total = appointments?.length ?? 0
  const completed = appointments?.filter((a) => a.status === 'COMPLETED').length ?? 0
  const noShow = appointments?.filter((a) => a.status === 'NO_SHOW').length ?? 0
  const pending = total - completed - noShow

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => { setCurrentMonth((m) => subMonths(m, 1)); setSelectedDay(null) }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <p className="text-xs font-semibold capitalize text-muted-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => { setCurrentMonth((m) => addMonths(m, 1)); setSelectedDay(null) }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      ) : (
        <>
          {/* Calendar grid */}
          <div>
            <div className="grid grid-cols-7">
              {WEEK_DAYS_SHORT.map((d, i) => (
                <div key={i} className="flex items-center justify-center h-6">
                  <span className="text-[10px] font-medium text-muted-foreground/60">{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`b-${i}`} />)}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const count = byDay[key]?.length ?? 0
                const isCurrent = isToday(day)
                const isSelected = selectedDay === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={cn(
                      'flex flex-col items-center justify-center h-8 w-full rounded-md text-xs font-medium transition-colors',
                      isCurrent && 'bg-primary text-primary-foreground',
                      !isCurrent && isSelected && 'bg-muted ring-1 ring-primary/40 text-primary',
                      !isCurrent && !isSelected && count > 0 && 'hover:bg-muted',
                      !isCurrent && !isSelected && count === 0 && 'text-muted-foreground/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="leading-none">{format(day, 'd')}</span>
                    {count > 0 && (
                      <span className={cn(
                        'w-1 h-1 rounded-full mt-0.5',
                        isCurrent ? 'bg-primary-foreground/70' : 'bg-primary'
                      )} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span> total
            </span>
            <span className="text-muted-foreground/30 hidden sm:block">·</span>
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-emerald-600">{completed}</span> concluídos
            </span>
            <span className="text-muted-foreground/30 hidden sm:block">·</span>
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-blue-500">{pending}</span> pendentes
            </span>
            {noShow > 0 && (
              <>
                <span className="text-muted-foreground/30 hidden sm:block">·</span>
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-orange-500">{noShow}</span> não compareceram
                </span>
              </>
            )}
          </div>

          {/* Selected day appointments */}
          <div className="space-y-2">
            {selectedDay ? (
              <>
                <p className="text-xs font-semibold text-muted-foreground capitalize">
                  {format(new Date(selectedDay + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                {selectedAppts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">Sem atendimentos neste dia</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedAppts.map((appt) => {
                      const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.SCHEDULED
                      return (
                        <div
                          key={appt.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 border-l-[3px] bg-card',
                            cfg.border
                          )}
                        >
                          {/* Time */}
                          <div className="text-right min-w-[34px] shrink-0">
                            <p className="text-xs font-semibold tabular-nums leading-none">
                              {format(new Date(appt.startTime), 'HH:mm')}
                            </p>
                            <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                              {format(new Date(appt.endTime), 'HH:mm')}
                            </p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{appt.patient?.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {TYPE_LABELS[appt.type] ?? appt.type}
                            </p>
                          </div>

                          {/* Status + session */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', cfg.badge)}>
                              {cfg.label}
                            </span>
                            {appt.status !== 'NO_SHOW' && (
                              <SessionButton
                                appointmentId={appt.id}
                                patientId={appt.patientId}
                                physiotherapistId={appt.physiotherapistId}
                                appointmentDate={appt.startTime}
                                patientName={appt.patient?.name}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                Selecione um dia no calendário para ver os atendimentos
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Year view ────────────────────────────────────────────────────────────────

function YearView({ userId }: { userId: string }) {
  const [year, setYear] = useState(() => new Date().getFullYear())

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', { from: `${year}-01-01`, to: `${year}-12-31`, physiotherapistId: userId }],
    queryFn: () =>
      fetchAppointments({ from: `${year}-01-01`, to: `${year}-12-31`, physiotherapistId: userId }),
  })

  const monthlyData = useMemo(() => {
    return MONTH_NAMES_SHORT.map((_, i) => {
      const appts = appointments?.filter((a) => new Date(a.startTime).getMonth() === i) ?? []
      return {
        total: appts.length,
        completed: appts.filter((a) => a.status === 'COMPLETED').length,
        noShow: appts.filter((a) => a.status === 'NO_SHOW').length,
      }
    })
  }, [appointments])

  const maxTotal = Math.max(...monthlyData.map((d) => d.total), 1)
  const yearTotal = monthlyData.reduce((s, d) => s + d.total, 0)
  const yearCompleted = monthlyData.reduce((s, d) => s + d.completed, 0)
  const currentMonthIdx = new Date().getMonth()
  const currentYearNum = new Date().getFullYear()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="text-center">
          <p className="text-xs font-semibold">{year}</p>
          {!isLoading && (
            <p className="text-[10px] text-muted-foreground">
              {yearTotal} atendimentos · {yearCompleted} concluídos
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {MONTH_NAMES_SHORT.map((name, i) => {
            const data = monthlyData[i]
            const barPct = (data.total / maxTotal) * 100
            const isCurrent = year === currentYearNum && i === currentMonthIdx
            return (
              <div key={name} className="flex items-center gap-2.5">
                <span className={cn(
                  'text-[11px] font-medium w-6 shrink-0',
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {name}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', isCurrent ? 'bg-primary' : 'bg-primary/40')}
                    style={{ width: data.total === 0 ? '0%' : `${barPct}%` }}
                  />
                </div>
                <span className={cn(
                  'text-[11px] tabular-nums w-5 text-right shrink-0',
                  data.total === 0 ? 'text-muted-foreground/40' : 'text-foreground font-medium'
                )}>
                  {data.total}
                </span>
                {data.total > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 w-14">
                    {data.completed} ok{data.noShow > 0 ? ` · ${data.noShow} falt.` : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PhysiotherapistDashboard({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const firstName = userName.split(' ')[0]
  const today = new Date()

  const { data: stats } = useQuery({
    queryKey: ['physio-stats', userId],
    queryFn: () => fetchPhysioStats(userId),
  })

  const kpis = [
    {
      label: 'Agendamentos Hoje',
      value: stats?.appointmentsToday ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Agendamentos na Semana',
      value: stats?.appointmentsThisWeek ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Sessões Registradas',
      value: stats?.completedSessions ?? 0,
      icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Pacientes Atendidos',
      value: stats?.uniquePatients ?? 0,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {firstName}</h1>
        <p className="text-muted-foreground capitalize">
          {formatDate(today, "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg', kpi.bg)}>
                  <Icon className={cn('h-4 w-4', kpi.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meus Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <TodayList userId={userId} />
        </CardContent>
      </Card>

      {/* Histórico de Atendimentos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico de Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="month">
            <TabsList className="h-8 p-0.5 rounded-lg mb-4">
              <TabsTrigger value="month" className="h-7 px-4 text-xs rounded-md">Mês</TabsTrigger>
              <TabsTrigger value="year" className="h-7 px-4 text-xs rounded-md">Ano</TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-0">
              <MonthView userId={userId} />
            </TabsContent>

            <TabsContent value="year" className="mt-0">
              <YearView userId={userId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
