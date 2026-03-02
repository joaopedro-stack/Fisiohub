'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, Calendar, Clock, CheckCircle2, Loader2, ChevronLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  patientName: z.string().min(2, 'Nome completo obrigatório'),
  patientPhone: z.string().min(8, 'Telefone obrigatório'),
  patientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  physiotherapistId: z.string().min(1, 'Selecione um fisioterapeuta'),
  date: z.string().min(1, 'Selecione uma data'),
  slot: z.string().min(1, 'Selecione um horário'),
  type: z.enum(['INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Slot { start: string; end: string }
interface BookingData { physiotherapists: { id: string; name: string }[]; slots: Slot[]; duration?: number }

const TYPE_LABELS = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento / Retorno',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

// Get today's date string in YYYY-MM-DD
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AgendarPage() {
  const [submitted, setSubmitted] = useState(false)
  const [confirmedAppt, setConfirmedAppt] = useState<{ patient: { name: string }; startTime: string; physiotherapist: { name: string } } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      physiotherapistId: '',
      date: todayStr(),
      slot: '',
      type: 'INITIAL_EVALUATION',
      notes: '',
    },
  })

  const physiotherapistId = watch('physiotherapistId')
  const date = watch('date')
  const slot = watch('slot')
  const type = watch('type')

  const { data, isLoading } = useQuery<BookingData>({
    queryKey: ['booking', physiotherapistId, date],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (physiotherapistId) params.set('physiotherapistId', physiotherapistId)
      if (date) params.set('date', date)
      const res = await fetch(`/api/booking?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar horários')
      return res.json()
    },
  })

  const physiotherapists = data?.physiotherapists ?? []
  const slots = data?.slots ?? []
  const duration = data?.duration ?? 60

  const { mutate: book, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const [startHH, startMM] = formData.slot.split(':')
      const startMinutes = parseInt(startHH) * 60 + parseInt(startMM)
      const endMinutes = startMinutes + duration
      const endHH = Math.floor(endMinutes / 60)
      const endMM = endMinutes % 60
      const endTime = `${String(endHH).padStart(2, '0')}:${String(endMM).padStart(2, '0')}`

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.patientName,
          patientPhone: formData.patientPhone,
          patientEmail: formData.patientEmail || undefined,
          physiotherapistId: formData.physiotherapistId,
          date: formData.date,
          startTime: formData.slot,
          endTime,
          type: formData.type,
          notes: formData.notes,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao agendar')
      }
      return res.json()
    },
    onSuccess: (appt) => {
      setConfirmedAppt(appt)
      setSubmitted(true)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao agendar'),
  })

  // Success screen
  if (submitted && confirmedAppt) {
    const apptDate = new Date(confirmedAppt.startTime)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Agendamento confirmado!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Seu agendamento foi registrado com sucesso.
              </p>
            </div>
            <Card className="bg-muted/50 text-left">
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="capitalize">
                    {format(apptDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{format(apptDate, 'HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{confirmedAppt.physiotherapist?.name}</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Chegue com 10 minutos de antecedência.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setSubmitted(false); setConfirmedAppt(null) }}
            >
              Fazer outro agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedPhysio = physiotherapists.find((p) => p.id === physiotherapistId)
  const selectedSlotObj = slots.find((s) => s.start === slot)

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">FisioHub</h1>
          <p className="text-xs text-muted-foreground">Agendamento online</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendar consulta</CardTitle>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo para marcar seu horário</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => book(data))} className="space-y-5">

              {/* Personal data */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Seus dados
                </p>
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome completo *</Label>
                  <Input id="patientName" placeholder="Seu nome" {...register('patientName')} />
                  {errors.patientName && <p className="text-xs text-destructive">{errors.patientName.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Telefone / WhatsApp *</Label>
                    <Input id="patientPhone" type="tel" placeholder="(11) 99999-0000" {...register('patientPhone')} />
                    {errors.patientPhone && <p className="text-xs text-destructive">{errors.patientPhone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (opcional)</Label>
                    <Input id="patientEmail" type="email" placeholder="seu@email.com" {...register('patientEmail')} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Scheduling */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Escolha horário
                </p>

                {/* Physiotherapist */}
                <div className="space-y-2">
                  <Label>Fisioterapeuta *</Label>
                  <Select
                    value={physiotherapistId}
                    onValueChange={(v) => { setValue('physiotherapistId', v); setValue('slot', '') }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {physiotherapists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.physiotherapistId && <p className="text-xs text-destructive">{errors.physiotherapistId.message}</p>}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    min={todayStr()}
                    {...register('date', { onChange: () => setValue('slot', '') })}
                  />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>

                {/* Time slots */}
                {physiotherapistId && date && (
                  <div className="space-y-2">
                    <Label>Horário disponível *</Label>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando horários...
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Nenhum horário disponível nesta data.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((s) => (
                          <button
                            key={s.start}
                            type="button"
                            onClick={() => setValue('slot', s.start)}
                            className={cn(
                              'px-2 py-2 rounded-lg border text-sm font-medium transition-all',
                              slot === s.start
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:border-primary/60 hover:bg-accent'
                            )}
                          >
                            <span className="block text-xs font-semibold">{s.start}</span>
                            <span className="block text-[10px] opacity-70">até {s.end}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.slot && <p className="text-xs text-destructive">{errors.slot.message}</p>}
                  </div>
                )}

                {/* Type */}
                <div className="space-y-2">
                  <Label>Tipo de consulta</Label>
                  <Select value={type} onValueChange={(v) => setValue('type', v as FormData['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Descreva brevemente seu problema ou motivo da consulta..."
                    {...register('notes')}
                  />
                </div>
              </div>

              {/* Summary */}
              {physiotherapistId && slot && (
                <Card className="bg-muted/40">
                  <CardContent className="pt-3 pb-3 space-y-1 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Resumo</p>
                    {selectedPhysio && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedPhysio.name}
                      </div>
                    )}
                    {date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">
                          {format(new Date(date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {selectedSlotObj && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedSlotObj.start} – {selectedSlotObj.end}
                        <Badge variant="secondary" className="text-[10px]">{duration} min</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar agendamento'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by FisioHub
        </p>
      </div>
    </div>
  )
}
