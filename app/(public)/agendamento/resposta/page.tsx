import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'

const STATES: Record<string, {
  icon: typeof CheckCircle2
  iconColor: string
  bgColor: string
  borderColor: string
  title: string
  description: string
}> = {
  confirmed: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    title: 'Presença confirmada!',
    description: 'Sua presença foi confirmada com sucesso. Até logo!',
  },
  cancelled: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Agendamento cancelado',
    description: 'Seu agendamento foi cancelado. Para reagendar, entre em contato com a clínica.',
  },
  not_found: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Agendamento não encontrado',
    description: 'Este agendamento não existe ou já foi removido.',
  },
  already_completed: {
    icon: Clock,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Consulta já concluída',
    description: 'Esta consulta já foi realizada e não pode ser alterada.',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Ocorreu um erro',
    description: 'Não foi possível processar sua solicitação. Tente novamente ou entre em contato com a clínica.',
  },
  invalid: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Link inválido ou expirado',
    description: 'Este link é inválido ou expirou. Os links têm validade de 7 dias.',
  },
}

export default async function AppointmentResponsePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const status = statusParam ?? 'invalid'
  const state = STATES[status] ?? STATES.invalid
  const Icon = state.icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className={`rounded-2xl border ${state.borderColor} ${state.bgColor} p-8 text-center shadow-sm`}>
          <div className="flex justify-center mb-4">
            <Icon className={`h-14 w-14 ${state.iconColor}`} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{state.title}</h1>
          <p className="text-sm text-gray-600">{state.description}</p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          FisioHub — Gestão de Fisioterapia
        </p>
      </div>
    </div>
  )
}
