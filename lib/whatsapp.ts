import { formatDate, formatTime } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Acompanhamento',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

function getConfig() {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !instanceToken || !clientToken) throw new Error('Z-API not configured')
  return { instanceId, instanceToken, clientToken }
}

/** Strips formatting and ensures E.164-like format without + (e.g. 5511999999999) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

async function sendText(to: string, message: string): Promise<void> {
  const { instanceId, instanceToken, clientToken } = getConfig()
  const phone = normalizePhone(to)

  const res = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify({ phone, message }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Z-API error ${res.status}: ${body}`)
  }
}

export interface AppointmentWhatsAppParams {
  to: string
  patientName: string
  physiotherapistName: string
  startTime: Date
  clinicName: string
  type?: string
  confirmUrl: string
  cancelUrl: string
}

export async function sendAppointmentWhatsApp(params: AppointmentWhatsAppParams): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName, type, confirmUrl, cancelUrl } = params
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : 'Consulta'
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const message = [
    `Olá, *${patientName}*! 👋`,
    '',
    `*${clinicName}* — novo agendamento registrado:`,
    '',
    `📋 *${typeLabel}*`,
    `👨‍⚕️ ${physiotherapistName}`,
    `📆 ${dateStr}`,
    `⏰ ${timeStr}`,
    '',
    'Por favor, confirme sua presença:',
    `✅ Confirmar: ${confirmUrl}`,
    `❌ Cancelar: ${cancelUrl}`,
    '',
    '_Este link expira em 7 dias._',
  ].join('\n')

  await sendText(to, message)
}

export interface AppointmentReminderWhatsAppParams {
  to: string
  patientName: string
  physiotherapistName: string
  startTime: Date
  clinicName: string
}

export async function sendAppointmentReminderWhatsApp(params: AppointmentReminderWhatsAppParams): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName } = params
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const message = [
    `Olá, *${patientName}*! 👋`,
    '',
    `Lembramos que você tem uma consulta amanhã em *${clinicName}*:`,
    '',
    `👨‍⚕️ ${physiotherapistName}`,
    `📆 ${dateStr}`,
    `⏰ ${timeStr}`,
    '',
    'Caso não possa comparecer, entre em contato com a clínica com antecedência.',
  ].join('\n')

  await sendText(to, message)
}

export async function sendAppointmentCancellationWhatsApp(params: AppointmentReminderWhatsAppParams): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName } = params
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const message = [
    `Olá, *${patientName}*. 👋`,
    '',
    `Informamos que sua consulta em *${clinicName}* foi cancelada:`,
    '',
    `👨‍⚕️ ${physiotherapistName}`,
    `📆 ${dateStr}`,
    `⏰ ${timeStr}`,
    '',
    'Para reagendar, entre em contato com a clínica.',
  ].join('\n')

  await sendText(to, message)
}
