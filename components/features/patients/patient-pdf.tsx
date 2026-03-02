import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDate, formatDateTime } from '@/lib/utils'

const BRAND = '#0f172a'
const MUTED = '#64748b'
const BORDER = '#e2e8f0'
const GREEN = '#16a34a'
const RED = '#dc2626'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  headerLeft: { flex: 1 },
  clinicName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND, marginBottom: 2 },
  headerSub: { fontSize: 8, color: MUTED },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BRAND, marginBottom: 2 },
  docDate: { fontSize: 8, color: MUTED },
  // Section
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  // Grid fields
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  field: { width: '48%', marginBottom: 4 },
  fieldFull: { width: '100%', marginBottom: 4 },
  fieldLabel: { fontSize: 7, color: MUTED, marginBottom: 1 },
  fieldValue: { fontSize: 9, color: '#0f172a' },
  // Table
  table: { width: '100%', marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: { flex: 1, fontSize: 8 },
  tableCellBold: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  tableCellHeader: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED },
  // Status badges
  statusGreen: { color: GREEN },
  statusRed: { color: RED },
  statusMuted: { color: MUTED },
  // Notes block
  notesBlock: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  notesText: { fontSize: 9, lineHeight: 1.5 },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: MUTED },
  // Empty state
  emptyText: { fontSize: 8, color: MUTED, fontStyle: 'italic', marginTop: 4 },
})

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_EVALUATION: 'Avaliação Inicial',
  FOLLOW_UP: 'Retorno',
  DISCHARGE: 'Alta',
  RETURN: 'Retorno',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
}

interface Physiotherapist {
  name: string
}

interface Appointment {
  id: string
  startTime: Date | string
  endTime: Date | string
  type: string
  status: string
  notes?: string | null
  physiotherapist: Physiotherapist
}

interface Session {
  id: string
  sessionNumber: number
  startTime: Date | string
  techniques: string[]
  notes?: string | null
  evolution?: string | null
  painLevel?: number | null
  physiotherapist: Physiotherapist
}

interface Anamnesis {
  chiefComplaint?: string | null
  history?: string | null
  medications?: string | null
  allergies?: string | null
  surgeries?: string | null
  familyHistory?: string | null
  lifestyle?: string | null
}

interface Patient {
  name: string
  email?: string | null
  phone?: string | null
  cpf?: string | null
  birthDate?: Date | string | null
  gender?: string | null
  address?: string | null
  healthInsurance?: string | null
  emergencyContact?: string | null
  notes?: string | null
  createdAt: Date | string
  appointments: Appointment[]
  sessions: Session[]
  anamnesis?: Anamnesis | null
}

interface PatientPDFProps {
  patient: Patient
  clinicName: string
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function FieldFull({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.fieldFull}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

export function PatientPDF({ patient, clinicName }: PatientPDFProps) {
  const issuedAt = formatDateTime(new Date())

  return (
    <Document title={`Prontuário — ${patient.name}`} author={clinicName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.clinicName}>{clinicName}</Text>
            <Text style={styles.headerSub}>FisioHub — Gestão de Fisioterapia</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Prontuário do Paciente</Text>
            <Text style={styles.docDate}>Emitido em {issuedAt}</Text>
          </View>
        </View>

        {/* Personal Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <View style={styles.grid}>
            <Field label="Nome completo" value={patient.name} />
            <Field label="Data de cadastro" value={formatDate(patient.createdAt)} />
            <Field label="Email" value={patient.email} />
            <Field label="Telefone" value={patient.phone} />
            <Field label="CPF" value={patient.cpf} />
            <Field label="Data de nascimento" value={patient.birthDate ? formatDate(patient.birthDate) : null} />
            <Field label="Gênero" value={patient.gender ? (GENDER_LABELS[patient.gender] ?? patient.gender) : null} />
            <Field label="Plano de saúde" value={patient.healthInsurance} />
            <FieldFull label="Endereço" value={patient.address} />
            <FieldFull label="Contato de emergência" value={patient.emergencyContact} />
            {patient.notes && <FieldFull label="Observações" value={patient.notes} />}
          </View>
        </View>

        {/* Anamnesis */}
        {patient.anamnesis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anamnese</Text>
            <View style={styles.grid}>
              {patient.anamnesis.chiefComplaint && (
                <FieldFull label="Queixa principal" value={patient.anamnesis.chiefComplaint} />
              )}
              {patient.anamnesis.history && (
                <FieldFull label="Histórico clínico" value={patient.anamnesis.history} />
              )}
              {patient.anamnesis.medications && (
                <Field label="Medicamentos em uso" value={patient.anamnesis.medications} />
              )}
              {patient.anamnesis.allergies && (
                <Field label="Alergias" value={patient.anamnesis.allergies} />
              )}
              {patient.anamnesis.surgeries && (
                <Field label="Cirurgias anteriores" value={patient.anamnesis.surgeries} />
              )}
              {patient.anamnesis.familyHistory && (
                <Field label="Histórico familiar" value={patient.anamnesis.familyHistory} />
              )}
              {patient.anamnesis.lifestyle && (
                <FieldFull label="Estilo de vida" value={patient.anamnesis.lifestyle} />
              )}
            </View>
          </View>
        )}

        {/* Sessions (Prontuário) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prontuário de Sessões</Text>
          {patient.sessions.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma sessão registrada.</Text>
          ) : (
            patient.sessions.map((session) => (
              <View key={session.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
                    Sessão #{session.sessionNumber} — {formatDate(session.startTime)}
                  </Text>
                  <Text style={{ fontSize: 8, color: MUTED }}>
                    Fisio: {session.physiotherapist.name}
                    {session.painLevel != null ? `  |  Dor: ${session.painLevel}/10` : ''}
                  </Text>
                </View>
                {session.techniques.length > 0 && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={styles.fieldLabel}>Técnicas:</Text>
                    <Text style={styles.fieldValue}>{session.techniques.join(', ')}</Text>
                  </View>
                )}
                {session.evolution && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={styles.fieldLabel}>Evolução:</Text>
                    <View style={styles.notesBlock}>
                      <Text style={styles.notesText}>{session.evolution}</Text>
                    </View>
                  </View>
                )}
                {session.notes && (
                  <View>
                    <Text style={styles.fieldLabel}>Observações:</Text>
                    <Text style={styles.notesText}>{session.notes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Appointment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Agendamentos</Text>
          {patient.appointments.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum agendamento registrado.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>Data</Text>
                <Text style={styles.tableCellHeader}>Tipo</Text>
                <Text style={styles.tableCellHeader}>Fisioterapeuta</Text>
                <Text style={styles.tableCellHeader}>Status</Text>
              </View>
              {patient.appointments.map((appt) => (
                <View key={appt.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{formatDateTime(appt.startTime)}</Text>
                  <Text style={styles.tableCell}>{TYPE_LABELS[appt.type] ?? appt.type}</Text>
                  <Text style={styles.tableCell}>{appt.physiotherapist.name}</Text>
                  <Text style={[
                    styles.tableCell,
                    appt.status === 'COMPLETED' ? styles.statusGreen :
                    appt.status === 'CANCELLED' || appt.status === 'NO_SHOW' ? styles.statusRed :
                    styles.statusMuted,
                  ]}>
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{clinicName} · Prontuário de {patient.name}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
