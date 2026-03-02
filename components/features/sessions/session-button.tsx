'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SessionForm } from './session-form'
import type { ClinicalSession } from '@/types'

interface SessionButtonProps {
  appointmentId: string
  patientId: string
  physiotherapistId: string
  appointmentDate: string | Date
  patientName?: string
  nextSessionNumber?: number
  /** className passed to the trigger button */
  className?: string
}

export function SessionButton({
  appointmentId,
  patientId,
  physiotherapistId,
  appointmentDate,
  patientName,
  nextSessionNumber = 1,
  className,
}: SessionButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery<ClinicalSession | null>({
    queryKey: ['session', 'appointment', appointmentId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions?appointmentId=${appointmentId}`)
      if (!res.ok) return null
      const sessions: ClinicalSession[] = await res.json()
      return sessions[0] ?? null
    },
    enabled: open,
    staleTime: 30_000,
  })

  const hasSession = !!session

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className={
          className ??
          'h-7 w-7 rounded-md text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
        }
        onClick={() => setOpen(true)}
        title={hasSession ? 'Ver / editar sessão' : 'Registrar sessão'}
      >
        <ClipboardList className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {hasSession ? 'Editar Sessão' : 'Registrar Sessão'}
            </DialogTitle>
            {patientName && (
              <DialogDescription>
                {patientName} — preencha os dados da sessão clínica
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <SessionForm
              appointmentId={appointmentId}
              patientId={patientId}
              physiotherapistId={physiotherapistId}
              appointmentDate={appointmentDate}
              session={session}
              nextSessionNumber={nextSessionNumber}
              onSuccess={() => {
                setOpen(false)
                queryClient.invalidateQueries({ queryKey: ['appointments'] })
                queryClient.invalidateQueries({ queryKey: ['physio-stats'] })
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
