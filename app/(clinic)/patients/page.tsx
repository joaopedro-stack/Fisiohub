import { PatientTable } from '@/components/features/patients/patient-table'

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
        <p className="text-muted-foreground">Gerencie os pacientes da clínica</p>
      </div>
      <PatientTable />
    </div>
  )
}
