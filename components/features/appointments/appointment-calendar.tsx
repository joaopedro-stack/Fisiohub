'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, CalendarDays, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppointmentForm } from './appointment-form'
import { useCurrentUser } from '@/hooks/use-tenant'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-dialog'
import { SessionButton } from '@/components/features/sessions/session-button'
import type { Appointment } from '@/types'

/* ─── Status palette ─────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-violet-500',
  CONFIRMED: 'bg-blue-500',
  COMPLETED: 'bg-emerald-500',
  NO_SHOW:   'bg-orange-400',
  // legacy — may exist in old records
  IN_PROGRESS: 'bg-amber-500',
  CANCELLED:   'bg-red-400',
}

const STATUS_CARD: Record<string, string> = {
  SCHEDULED: 'border-l-violet-500  bg-violet-50/80  dark:bg-violet-950/20',
  CONFIRMED: 'border-l-blue-500    bg-blue-50/80    dark:bg-blue-950/20',
  COMPLETED: 'border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/20',
  NO_SHOW:   'border-l-orange-400  bg-orange-50/80  dark:bg-orange-950/20',
  // legacy
  IN_PROGRESS: 'border-l-amber-500 bg-amber-50/80  dark:bg-amber-950/20',
  CANCELLED:   'border-l-red-400   bg-red-50/80    dark:bg-red-950/20',
}

// Labels shown on the badge inside each card
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  NO_SHOW:   'Não compareceu',
  // legacy
  IN_PROGRESS: 'Em andamento',
  COMPLETED:   'Concluído',
  CANCELLED:   'Cancelado',
}

// Options shown in the status-change dropdown (Cancelar = delete)
const STATUS_OPTIONS = [
  { value: 'SCHEDULED',  label: 'Agendado',              dot: 'bg-violet-500',  cancel: false },
  { value: 'CONFIRMED',  label: 'Confirmado',             dot: 'bg-blue-500',    cancel: false },
  { value: 'COMPLETED',  label: 'Concluído',              dot: 'bg-emerald-500', cancel: false },
  { value: 'NO_SHOW',    label: 'Não compareceu',         dot: 'bg-orange-400',  cancel: false },
  { value: 'CANCELLED',  label: 'Cancelar agendamento',   dot: 'bg-red-400',     cancel: true  },
]

// Statuses shown in the calendar legend
const LEGEND_ENTRIES = [
  { status: 'SCHEDULED', label: 'Agendado' },
  { status: 'CONFIRMED', label: 'Confirmado' },
  { status: 'COMPLETED', label: 'Concluído' },
  { status: 'NO_SHOW',   label: 'Não compareceu' },
  { status: 'CANCELLED', label: 'Cancelado' },
]

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP:          'Acompanhamento',
  DISCHARGE:          'Alta',
  RETURN:             'Retorno',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/* ─── Appointment card inside DayModal ──────────────────────── */
function AppointmentCard({
  appt,
  index,
  onEdit,
  onDeleted,
  onStatusChanged,
}: {
  appt: Appointment
  index: number
  onEdit: (a: Appointment) => void
  onDeleted: () => void
  onStatusChanged: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const { mutate: deleteAppt, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointments/${appt.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
    },
    onSuccess: () => {
      toast.success('Agendamento excluído')
      setShowConfirm(false)
      onDeleted()
    },
    onError: () => toast.error('Erro ao excluir agendamento'),
  })

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar status')
    },
    onSuccess: () => {
      toast.success('Status atualizado')
      onStatusChanged()
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const handleOptionClick = (option: typeof STATUS_OPTIONS[number]) => {
    if (option.cancel) {
      setShowConfirm(true)
    } else {
      updateStatus(option.value)
    }
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border-l-4 px-4 py-3',
          'transition-all duration-150',
          'animate-in fade-in slide-in-from-bottom-1',
          STATUS_CARD[appt.status] ?? 'border-l-gray-300 bg-muted/50',
        )}
        style={{ animationDelay: `${index * 45}ms` }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              {format(new Date(appt.startTime), 'HH:mm')} – {format(new Date(appt.endTime), 'HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/70 border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={isUpdatingStatus}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full mr-1', STATUS_DOT[appt.status])} />
                  {STATUS_LABELS[appt.status] ?? appt.status}
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    disabled={!opt.cancel && appt.status === opt.value}
                    onClick={() => handleOptionClick(opt)}
                    className={cn('flex items-center gap-2 text-xs', opt.cancel && 'text-destructive focus:text-destructive')}
                  >
                    <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {appt.status !== 'NO_SHOW' && (
              <SessionButton
                appointmentId={appt.id}
                patientId={appt.patientId}
                physiotherapistId={appt.physiotherapistId}
                appointmentDate={appt.startTime}
                patientName={appt.patient?.name}
                className="h-6 w-6 rounded text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              />
            )}
          </div>
        </div>

        <button
          className="w-full text-left hover:opacity-80 transition-opacity"
          onClick={() => onEdit(appt)}
        >
          <p className="font-semibold text-sm text-foreground leading-snug">
            {appt.patient?.name ?? 'Paciente'}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
            {appt.physiotherapist && (
              <span className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {appt.physiotherapist.name}
              </span>
            )}
            {appt.room && (
              <span className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {appt.room.name}
              </span>
            )}
            <span className="text-[10px] ml-auto opacity-60">
              {TYPE_LABELS[appt.type] ?? appt.type}
            </span>
          </div>
        </button>
      </div>

      <ConfirmDeleteDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={() => deleteAppt()}
        isPending={isPending}
        title="Excluir agendamento"
        description={`Tem certeza que deseja excluir o agendamento de ${appt.patient?.name ?? 'paciente'}? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}

/* ─── Day Detail Modal ───────────────────────────────────────── */
function DayModal({
  day, appointments, onEdit, onNew, onDeleted, onStatusChanged,
}: {
  day: Date
  appointments: Appointment[]
  onEdit: (a: Appointment) => void
  onNew: () => void
  onDeleted: () => void
  onStatusChanged: () => void
}) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="text-lg capitalize">
              {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sorted.length === 0
                ? 'Nenhum agendamento'
                : `${sorted.length} agendamento${sorted.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button size="sm" onClick={onNew} className="shrink-0 mt-0.5">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Novo
          </Button>
        </div>
      </DialogHeader>

      <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-0.5 mt-1">
        {sorted.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <CalendarDays className="h-10 w-10 opacity-20" />
            <p className="text-sm">Sem agendamentos neste dia</p>
            <Button variant="outline" size="sm" onClick={onNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Criar agendamento
            </Button>
          </div>
        ) : (
          sorted.map((appt, i) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              index={i}
              onEdit={onEdit}
              onDeleted={onDeleted}
              onStatusChanged={onStatusChanged}
            />
          ))
        )}
      </div>
    </DialogContent>
  )
}

/* ─── Main Calendar ──────────────────────────────────────────── */
export function AppointmentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()

  const { user } = useCurrentUser()
  const queryClient = useQueryClient()

  const { calendarStart, calendarEnd } = useMemo(() => {
    const ms = startOfMonth(currentMonth)
    const me = endOfMonth(currentMonth)
    return {
      calendarStart: startOfWeek(ms, { weekStartsOn: 0 }),
      calendarEnd: endOfWeek(me, { weekStartsOn: 0 }),
    }
  }, [currentMonth])

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  )

  const isPhysio = user?.role === 'PHYSIOTHERAPIST'
  const physiotherapistParam = isPhysio && user?.id ? `&physiotherapistId=${user.id}` : ''

  const { data: appointments = [], isFetching } = useQuery<Appointment[]>({
    queryKey: [
      'appointments',
      format(calendarStart, 'yyyy-MM-dd'),
      format(calendarEnd, 'yyyy-MM-dd'),
      isPhysio ? user?.id : 'all',
    ],
    queryFn: async () => {
      const from = format(calendarStart, 'yyyy-MM-dd')
      const to = format(calendarEnd, 'yyyy-MM-dd')
      const res = await fetch(`/api/appointments?from=${from}&to=${to}${physiotherapistParam}`)
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 30_000,
  })

  const getApptForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.startTime), day))

  const today = new Date()

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    setShowDayModal(true)
  }

  const handleNewFromDay = () => {
    setShowDayModal(false)
    setEditAppointment(null)
    setDefaultDate(selectedDay ?? new Date())
    setShowForm(true)
  }

  const handleEditFromDay = (appt: Appointment) => {
    setShowDayModal(false)
    setEditAppointment(appt)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const handleDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const countBadgeClass = (n: number) =>
    n >= 5 ? 'bg-red-500 text-white' : n >= 3 ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="h-8 w-8 transition-all hover:border-primary/60 hover:shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="font-semibold text-base min-w-[170px] text-center capitalize select-none">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          <Button
            variant="outline" size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="h-8 w-8 transition-all hover:border-primary/60 hover:shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost" size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Hoje
          </Button>

          {isFetching && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>

        <Button
          onClick={() => { setEditAppointment(null); setDefaultDate(new Date()); setShowForm(true) }}
          className="transition-all hover:shadow-md active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2.5 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {wd}
              </span>
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayAppts = getApptForDay(day)
            const count = dayAppts.length
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isSameDay(day, today)

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'calendar-cell relative min-h-[88px] p-2 cursor-pointer group',
                  'border-b border-r transition-all duration-150',
                  '[&:nth-child(7n)]:border-r-0',
                  isCurrentDay
                    ? 'bg-primary/5'
                    : 'hover:bg-accent/40',
                  !isCurrentMonth && 'bg-muted/20',
                )}
                style={{ animationDelay: `${idx * 6}ms` }}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 text-sm font-semibold rounded-full transition-all',
                      isCurrentDay
                        ? 'bg-primary text-primary-foreground text-xs shadow-sm'
                        : cn(
                            'group-hover:bg-primary/10 group-hover:text-primary',
                            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                          ),
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {count > 0 && (
                    <span
                      className={cn(
                        'count-badge h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold',
                        'flex items-center justify-center leading-none',
                        countBadgeClass(count),
                      )}
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>

                {/* Mini pills */}
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map((appt) => (
                    <div key={appt.id} className="flex items-center gap-1 text-[10px] leading-tight">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[appt.status])} />
                      <span className={cn(
                        'truncate font-medium',
                        isCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground/40',
                      )}>
                        {format(new Date(appt.startTime), 'HH:mm')}{' '}
                        {appt.patient?.name?.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                  {count > 2 && (
                    <p className="text-[10px] text-muted-foreground/60 pl-2.5">
                      +{count - 2} mais
                    </p>
                  )}
                </div>

                {/* Empty hover hint */}
                {count === 0 && isCurrentMonth && (
                  <div className="absolute inset-0 flex items-end justify-end p-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
        {LEGEND_ENTRIES.map(({ status, label }) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} />
            {label}
          </span>
        ))}
      </div>

      {/* Day Modal */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        {selectedDay && (
          <DayModal
            day={selectedDay}
            appointments={getApptForDay(selectedDay)}
            onEdit={handleEditFromDay}
            onNew={handleNewFromDay}
            onDeleted={handleDeleted}
            onStatusChanged={handleDeleted}
          />
        )}
      </Dialog>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editAppointment}
            defaultDate={defaultDate}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
