import { Resend } from 'resend'
import { formatDate, formatTime } from '@/lib/utils'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY not set')
  return new Resend(key)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@fisiohub.com.br'

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Retorno',
  DISCHARGE: 'Alta',
  RETURN: 'Consulta de Retorno',
}

function baseTemplate(title: string, content: string, clinicName: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${clinicName}</p>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">FisioHub — Gestão de Fisioterapia</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                Este é um email automático. Por favor, não responda.<br/>
                ${clinicName} · Powered by FisioHub
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface AppointmentEmailParams {
  to: string
  patientName: string
  physiotherapistName: string
  startTime: Date
  clinicName: string
  type?: string
}

export async function sendAppointmentConfirmation(params: AppointmentEmailParams): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName, type } = params
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : 'Consulta'
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const content = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Agendamento Confirmado ✓</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Olá, <strong>${patientName}</strong>! Seu agendamento foi registrado com sucesso.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Detalhes do Agendamento</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;width:140px;">Tipo:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Fisioterapeuta:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${physiotherapistName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Data:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Horário:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${timeStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#64748b;font-size:13px;">Qualquer dúvida, entre em contato com a clínica. Até breve!</p>
  `

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Agendamento confirmado — ${clinicName}`,
    html: baseTemplate('Agendamento Confirmado', content, clinicName),
  })
}

export async function sendAppointmentReminder(params: Omit<AppointmentEmailParams, 'type'>): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName } = params
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const content = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Lembrete de Consulta</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Olá, <strong>${patientName}</strong>! Lembramos que você tem uma consulta agendada para amanhã.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:#d97706;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Sua Consulta Amanhã</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;width:140px;">Fisioterapeuta:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${physiotherapistName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Data:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Horário:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${timeStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#64748b;font-size:13px;">
      Caso não possa comparecer, entre em contato com a clínica com antecedência.<br/>
      Até amanhã!
    </p>
  `

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Lembrete: consulta amanhã — ${clinicName}`,
    html: baseTemplate('Lembrete de Consulta', content, clinicName),
  })
}

export interface AppointmentActionRequestParams extends AppointmentEmailParams {
  confirmUrl: string
  cancelUrl: string
}

export async function sendAppointmentActionRequest(params: AppointmentActionRequestParams): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName, type, confirmUrl, cancelUrl } = params
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : 'Consulta'
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const content = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Confirme seu Agendamento</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Olá, <strong>${patientName}</strong>! Você tem uma consulta agendada. Por favor, confirme ou cancele sua presença.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:#0369a1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Detalhes do Agendamento</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;width:140px;">Tipo:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Fisioterapeuta:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${physiotherapistName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Data:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Horário:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${timeStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="48%" style="padding-right:8px;">
          <a href="${confirmUrl}" style="display:block;text-align:center;background:#16a34a;color:#ffffff;font-size:15px;font-weight:700;padding:14px 0;border-radius:8px;text-decoration:none;">
            ✓ Confirmar presença
          </a>
        </td>
        <td width="48%" style="padding-left:8px;">
          <a href="${cancelUrl}" style="display:block;text-align:center;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;padding:14px 0;border-radius:8px;text-decoration:none;">
            ✕ Cancelar agendamento
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Este link expira em 7 dias. Se não reconhece este agendamento, ignore este email.</p>
  `

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Confirme seu agendamento — ${clinicName}`,
    html: baseTemplate('Confirme seu Agendamento', content, clinicName),
  })
}

export async function sendAppointmentCancellation(params: Omit<AppointmentEmailParams, 'type'>): Promise<void> {
  const { to, patientName, physiotherapistName, startTime, clinicName } = params
  const dateStr = formatDate(startTime)
  const timeStr = formatTime(startTime)

  const content = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Agendamento Cancelado</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Olá, <strong>${patientName}</strong>. Informamos que seu agendamento foi cancelado.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:#dc2626;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Consulta Cancelada</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;width:140px;">Fisioterapeuta:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${physiotherapistName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Data:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Horário:</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${timeStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#64748b;font-size:13px;">Para reagendar, entre em contato com a clínica. Pedimos desculpas pelo inconveniente.</p>
  `

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Agendamento cancelado — ${clinicName}`,
    html: baseTemplate('Agendamento Cancelado', content, clinicName),
  })
}
