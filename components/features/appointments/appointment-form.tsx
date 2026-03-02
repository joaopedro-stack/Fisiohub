'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MapPin, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-tenant'
import type { Appointment, Patient, User, ClinicSettings, Room } from '@/types'

function isBusy(
  slotMinutes: number,
  durationMinutes: number,
  appointments: Appointment[],
  excludeId?: string,
): boolean {
  const slotEnd = slotMinutes + durationMinutes
  return appointments.some((a) => {
    if (excludeId && a.id === excludeId) return false
    if (['CANCELLED', 'NO_SHOW'].includes(a.status)) return false
    const s = new Date(a.startTime)
    const e = new Date(a.endTime)
    const aStart = s.getHours() * 60 + s.getMinutes()
    const aEnd = e.getHours() * 60 + e.getMinutes()
    return aStart < slotEnd && aEnd > slotMinutes
  })
}

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  physiotherapistId: z.string().min(1, 'Selecione um fisioterapeuta'),
  roomId: z.string().optional().nullable(),
  date: z.string().min(1, 'Selecione uma data'),
  startSlot: z.string().min(1, 'Selecione um horário'),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']),
  notes: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'INSURANCE', 'WAIVED']).default('PENDING'),
  paymentMethod: z.enum(['CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER']).optional().nullable(),
  paymentValue: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

const typeLabels = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

const paymentStatusLabels = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  INSURANCE: 'Plano de saúde',
  WAIVED: 'Isento',
}

const paymentMethodLabels = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CARD: 'Cartão',
  INSURANCE: 'Plano',
  OTHER: 'Outro',
}

interface AppointmentFormProps {
  appointment?: Appointment | null
  defaultDate?: Date
  onSuccess: () => void
}

function generateTimeSlots(opening: string, closing: string, duration: number): string[] {
  const slots: string[] = []
  const [oh, om] = opening.split(':').map(Number)
  const [ch, cm] = closing.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur + duration <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    cur += duration
  }
  return slots
}

function localDateString(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function slotFromDate(date: Date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function AppointmentForm({ appointment, defaultDate, onSuccess }: AppointmentFormProps) {
  const { user } = useCurrentUser()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await fetch('/api/patients?limit=100')
      const data = await res.json()
      return data.patients as Patient[]
    },
  })

  const { data: physiotherapists } = useQuery({
    queryKey: ['physiotherapists'],
    queryFn: async () => {
      const res = await fetch('/api/physiotherapists')
      return res.json() as Promise<User[]>
    },
    enabled: isAdmin,
  })

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: settings } = useQuery<ClinicSettings>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const sessionDuration = settings?.sessionDuration ?? 60
  const openingTime = settings?.openingTime ?? '08:00'
  const closingTime = settings?.closingTime ?? '18:00'

  const timeSlots = useMemo(
    () => generateTimeSlots(openingTime, closingTime, sessionDuration),
    [openingTime, closingTime, sessionDuration]
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: appointment?.patientId ?? '',
      physiotherapistId: appointment?.physiotherapistId ?? '',
      roomId: appointment?.roomId ?? null,
      date: appointment
        ? localDateString(new Date(appointment.startTime))
        : defaultDate
          ? localDateString(defaultDate)
          : '',
      startSlot: appointment ? slotFromDate(new Date(appointment.startTime)) : '',
      type: appointment?.type ?? 'FOLLOW_UP',
      notes: appointment?.notes ?? '',
      paymentStatus: appointment?.paymentStatus ?? 'PENDING',
      paymentMethod: appointment?.paymentMethod ?? null,
      paymentValue: appointment?.paymentValue != null ? String(appointment.paymentValue) : '',
    },
  })

  const type = watch('type')
  const patientId = watch('patientId')
  const physiotherapistId = watch('physiotherapistId')
  const startSlot = watch('startSlot')
  const roomId = watch('roomId')
  const date = watch('date')
  const paymentStatus = watch('paymentStatus')
  const paymentMethod = watch('paymentMethod')

  // Fetch existing appointments for the selected physiotherapist on the selected date
  const { data: physioAppointments } = useQuery<Appointment[]>({
    queryKey: ['busy-physio', physiotherapistId, date],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?physiotherapistId=${physiotherapistId}&date=${date}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!(physiotherapistId && date),
  })

  // Fetch existing appointments for the selected room on the selected date
  const { data: roomAppointments } = useQuery<Appointment[]>({
    queryKey: ['busy-room', roomId, date],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?roomId=${roomId}&date=${date}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!(roomId && roomId !== '__none__' && date),
  })

  // Compute available slots (remove slots occupied by physio or room)
  const availableSlots = useMemo(() => {
    return timeSlots.filter((slot) => {
      const [sh, sm] = slot.split(':').map(Number)
      const slotMinutes = sh * 60 + sm
      const busyForPhysio = physioAppointments
        ? isBusy(slotMinutes, sessionDuration, physioAppointments, appointment?.id)
        : false
      const busyForRoom = roomAppointments
        ? isBusy(slotMinutes, sessionDuration, roomAppointments, appointment?.id)
        : false
      return !busyForPhysio && !busyForRoom
    })
  }, [timeSlots, physioAppointments, roomAppointments, sessionDuration, appointment?.id])

  // Auto-assign physiotherapist for PHYSIOTHERAPIST role
  useEffect(() => {
    if (!isAdmin && user?.id && !appointment) {
      setValue('physiotherapistId', user.id)
    }
  }, [isAdmin, user?.id, appointment, setValue])

  useEffect(() => {
    if (startSlot && availableSlots.length > 0 && !availableSlots.includes(startSlot)) {
      setValue('startSlot', '')
    }
  }, [availableSlots, startSlot, setValue])

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const [sh, sm] = data.startSlot.split(':').map(Number)
      const startTime = new Date(`${data.date}T00:00:00`)
      startTime.setHours(sh, sm, 0, 0)
      const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000)

      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments'
      const method = appointment ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          physiotherapistId: data.physiotherapistId,
          roomId: data.roomId ?? null,
          type: data.type,
          notes: data.notes,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod ?? null,
          paymentValue: data.paymentValue ? parseFloat(data.paymentValue) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao salvar')
      }

      toast.success(appointment ? 'Agendamento atualizado!' : 'Agendamento criado!')
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar agendamento')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient */}
        <div className="space-y-2">
          <Label>Paciente *</Label>
          <Select value={patientId} onValueChange={(v) => setValue('patientId', v)}>
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patientId && <p className="text-sm text-destructive">{errors.patientId.message}</p>}
        </div>

        {/* Physiotherapist — only admins can choose; physio is auto-assigned */}
        {isAdmin ? (
          <div className="space-y-2">
            <Label>Fisioterapeuta *</Label>
            <Select value={physiotherapistId} onValueChange={(v) => setValue('physiotherapistId', v)}>
              <SelectTrigger className="transition-all hover:border-primary/50">
                <SelectValue placeholder="Selecione um fisioterapeuta" />
              </SelectTrigger>
              <SelectContent>
                {physiotherapists
                  ?.filter(u => ['PHYSIOTHERAPIST', 'ADMIN'].includes(u.role))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.physiotherapistId && <p className="text-sm text-destructive">{errors.physiotherapistId.message}</p>}
          </div>
        ) : null}

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            className="transition-all hover:border-primary/50"
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        {/* Time slot */}
        <div className="space-y-2">
          <Label>
            Horário *
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              ({sessionDuration} min · {openingTime}–{closingTime})
            </span>
          </Label>
          <Select value={startSlot} onValueChange={(v) => setValue('startSlot', v)}>
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent className="max-h-52">
              {availableSlots.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum horário disponível
                </div>
              ) : (
                availableSlots.map((slot) => {
                  const [sh, sm] = slot.split(':').map(Number)
                  const endMin = sh * 60 + sm + sessionDuration
                  const eh = Math.floor(endMin / 60)
                  const em = endMin % 60
                  const endStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
                  return (
                    <SelectItem key={slot} value={slot}>
                      {slot} – {endStr}
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>
          {errors.startSlot && <p className="text-sm text-destructive">{errors.startSlot.message}</p>}
        </div>

        {/* Room */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Sala
          </Label>
          <Select
            value={roomId ?? '__none__'}
            onValueChange={(v) => setValue('roomId', v === '__none__' ? null : v)}
          >
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue placeholder="Selecione uma sala (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-muted-foreground">Sem sala</span>
              </SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rooms.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Cadastre salas em Configurações → Salas
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v as AppointmentFormData['type'])}>
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment section header */}
        <div className="md:col-span-2 pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Pagamento
          </div>
          <div className="mt-2 h-px bg-border" />
        </div>

        {/* Payment status */}
        <div className="space-y-2">
          <Label>Status do pagamento</Label>
          <Select value={paymentStatus} onValueChange={(v) => setValue('paymentStatus', v as AppointmentFormData['paymentStatus'])}>
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <Label>Forma de pagamento</Label>
          <Select
            value={paymentMethod ?? '__none__'}
            onValueChange={(v) => setValue('paymentMethod', v === '__none__' ? null : v as AppointmentFormData['paymentMethod'])}
          >
            <SelectTrigger className="transition-all hover:border-primary/50">
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-muted-foreground">Não informado</span>
              </SelectItem>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment value */}
        <div className="space-y-2">
          <Label htmlFor="paymentValue">Valor (R$)</Label>
          <Input
            id="paymentValue"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register('paymentValue')}
            className="transition-all hover:border-primary/50"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="resize-none transition-all hover:border-primary/50"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {appointment ? 'Salvar alterações' : 'Criar agendamento'}
        </Button>
      </div>
    </form>
  )
}
