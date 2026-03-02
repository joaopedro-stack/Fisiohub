import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { notFound } from 'next/navigation'
import { differenceInYears } from 'date-fns'
import { formatDate, getInitials, formatPhone, formatCPF, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Phone, Mail, MapPin, Heart, Shield,
  Calendar, ClipboardList, Clock, User, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { PatientEditButton } from '@/components/features/patients/patient-edit-button'
import { AnamnesisButton } from '@/components/features/anamnesis/anamnesis-button'
import { PrintButton } from '@/components/features/patients/print-button'

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const STATUS_BORDER: Record<string, string> = {
  SCHEDULED: 'border-l-blue-500',
  CONFIRMED: 'border-l-emerald-500',
  IN_PROGRESS: 'border-l-amber-500',
  COMPLETED: 'border-l-gray-400',
  CANCELLED: 'border-l-red-400',
  NO_SHOW: 'border-l-orange-400',
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
  NO_SHOW: 'outline',
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

function PainBar({ level }: { level: number }) {
  const color = level <= 3 ? 'bg-emerald-500' : level <= 6 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = level <= 3 ? 'text-emerald-600' : level <= 6 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={cn('h-2 w-3.5 rounded-sm', i < level ? color : 'bg-muted')}
          />
        ))}
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', textColor)}>
        {level}/10
      </span>
    </div>
  )
}

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug') ?? session?.user.clinicSlug ?? ''

  const prisma = getTenantPrisma(slug)
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: {
          physiotherapist: { select: { name: true } },
          room: { select: { name: true } },
        },
        orderBy: { startTime: 'desc' },
      },
      sessions: {
        include: { physiotherapist: { select: { name: true } } },
        orderBy: { startTime: 'desc' },
      },
      anamnesis: true,
    },
  })

  if (!patient) notFound()

  // Computed stats
  const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : null
  const completedAppointments = patient.appointments.filter((a) => a.status === 'COMPLETED')
  const lastVisit = completedAppointments[0]?.startTime ?? null
  const totalSessions = patient.sessions.length

  // Cast to access typed fields
  type ApptWithRelations = (typeof patient.appointments)[number]
  type SessionWithRelations = (typeof patient.sessions)[number]

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/patients"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Avatar */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 shrink-0">
            <span className="text-xl font-bold text-primary">{getInitials(patient.name)}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                {patient.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[
                age != null ? `${age} anos` : null,
                patient.cpf ? formatCPF(patient.cpf) : null,
                patient.phone ? formatPhone(patient.phone) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print-hide">
          <PrintButton patientId={id} />
          <PatientEditButton patient={patient as unknown as import('@/types').Patient} />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{patient.appointments.length}</p>
                <p className="text-xs text-muted-foreground">Agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 shrink-0">
                <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessões realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950 shrink-0">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {lastVisit ? formatDate(lastVisit, "dd/MM/yyyy") : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Última visita</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Personal data */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {patient.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="break-all">{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{formatPhone(patient.phone)}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{patient.address}</span>
                </div>
              )}

              {(patient.birthDate || patient.gender || patient.cpf) && (
                <Separator />
              )}

              {patient.birthDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nascimento</span>
                  <span className="font-medium">{formatDate(patient.birthDate)}</span>
                </div>
              )}
              {patient.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gênero</span>
                  <span className="font-medium">{GENDER_LABELS[patient.gender]}</span>
                </div>
              )}
              {patient.cpf && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF</span>
                  <span className="font-medium font-mono text-xs">{formatCPF(patient.cpf)}</span>
                </div>
              )}

              {(patient.healthInsurance || patient.emergencyContact) && (
                <Separator />
              )}

              {patient.healthInsurance && (
                <div className="flex items-start gap-2.5">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Plano de saúde</p>
                    <p className="font-medium">{patient.healthInsurance}</p>
                  </div>
                </div>
              )}
              {patient.emergencyContact && (
                <div className="flex items-start gap-2.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contato de emergência</p>
                    <p className="font-medium">{patient.emergencyContact}</p>
                  </div>
                </div>
              )}

              {patient.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{patient.notes}</p>
                  </div>
                </>
              )}

              {!patient.email && !patient.phone && !patient.address && !patient.birthDate &&
               !patient.gender && !patient.cpf && !patient.healthInsurance &&
               !patient.emergencyContact && !patient.notes && (
                <p className="text-muted-foreground text-center py-2">Nenhum dado cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="prontuario">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="prontuario">
                Prontuário ({totalSessions})
              </TabsTrigger>
              <TabsTrigger value="appointments">
                Agendamentos ({patient.appointments.length})
              </TabsTrigger>
              <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
            </TabsList>

            {/* ── Prontuário (sessions) ──────────────────────── */}
            <TabsContent value="prontuario" className="mt-0">
              {patient.sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Nenhuma sessão registrada para este paciente</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(patient.sessions as SessionWithRelations[]).map((s) => (
                    <Card key={s.id} className="overflow-hidden">
                      <CardContent className="pt-4 space-y-3">
                        {/* Session header */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <span className="font-semibold text-sm">
                              Sessão #{s.sessionNumber}
                            </span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {formatDate(s.startTime, "dd/MM/yyyy")} às{' '}
                              {formatDate(s.startTime, "HH:mm")}
                            </span>
                          </div>
                          {s.physiotherapist && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {(s.physiotherapist as { name: string }).name}
                            </div>
                          )}
                        </div>

                        {/* Pain level */}
                        {s.painLevel != null && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                              Nível de dor
                            </span>
                            <PainBar level={s.painLevel} />
                          </div>
                        )}

                        {/* Techniques */}
                        {s.techniques.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {s.techniques.map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Evolution */}
                        {s.evolution && (
                          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Evolução clínica
                            </p>
                            <p className="text-sm leading-relaxed">{s.evolution}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {s.notes && (
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Anotações
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {s.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Agendamentos ──────────────────────────────── */}
            <TabsContent value="appointments" className="mt-0">
              {patient.appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                    <Calendar className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Nenhum agendamento registrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(patient.appointments as ApptWithRelations[]).map((appt) => (
                    <div
                      key={appt.id}
                      className={cn(
                        'rounded-lg border border-border/60 border-l-4 px-4 py-3 bg-card',
                        STATUS_BORDER[appt.status] ?? 'border-l-gray-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-sm">
                            {formatDate(appt.startTime, "dd/MM/yyyy")} às{' '}
                            {formatDate(appt.startTime, "HH:mm")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {TYPE_LABELS[appt.type] ?? appt.type}
                            {appt.physiotherapist && ` · ${(appt.physiotherapist as { name: string }).name}`}
                            {appt.room && ` · Sala ${(appt.room as { name: string }).name}`}
                          </p>
                        </div>
                        <Badge variant={STATUS_BADGE[appt.status] ?? 'outline'} className="shrink-0 text-xs">
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </Badge>
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{appt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Anamnese ──────────────────────────────────── */}
            <TabsContent value="anamnesis" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="text-sm font-semibold">
                      Histórico Clínico
                    </CardTitle>
                    <AnamnesisButton
                      patientId={patient.id}
                      patientName={patient.name}
                      anamnesis={patient.anamnesis as import('@/types').Anamnesis | null}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {!patient.anamnesis ? (
                    <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                      <AlertCircle className="h-10 w-10 opacity-20" />
                      <p className="text-sm">Anamnese não preenchida para este paciente</p>
                      <p className="text-xs text-center max-w-xs">
                        Clique em "Preencher anamnese" para registrar o histórico clínico
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        ['Queixa Principal', patient.anamnesis.chiefComplaint],
                        ['Histórico Clínico', patient.anamnesis.history],
                        ['Medicamentos em Uso', patient.anamnesis.medications],
                        ['Alergias', patient.anamnesis.allergies],
                        ['Cirurgias Anteriores', patient.anamnesis.surgeries],
                        ['Histórico Familiar', patient.anamnesis.familyHistory],
                        ['Estilo de Vida', patient.anamnesis.lifestyle],
                      ]
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <div key={label as string}>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                              {label}
                            </p>
                            <p className="text-sm leading-relaxed">{value}</p>
                            <Separator className="mt-4" />
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
