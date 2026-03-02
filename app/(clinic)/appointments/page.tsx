import { AppointmentCalendar } from '@/components/features/appointments/appointment-calendar'

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
        <p className="text-muted-foreground">Visualize e gerencie os agendamentos da clínica</p>
      </div>
      <AppointmentCalendar />
    </div>
  )
}
