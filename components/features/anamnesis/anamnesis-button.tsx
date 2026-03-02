'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardPlus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AnamnesisForm } from './anamnesis-form'
import type { Anamnesis } from '@/types'

interface AnamnesisButtonProps {
  patientId: string
  patientName: string
  anamnesis?: Anamnesis | null
}

export function AnamnesisButton({ patientId, patientName, anamnesis }: AnamnesisButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const hasAnamnesis = !!anamnesis

  return (
    <>
      <Button
        variant={hasAnamnesis ? 'outline' : 'default'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {hasAnamnesis ? (
          <>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar anamnese
          </>
        ) : (
          <>
            <ClipboardPlus className="h-3.5 w-3.5 mr-1.5" />
            Preencher anamnese
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {hasAnamnesis ? 'Editar Anamnese' : 'Preencher Anamnese'}
            </DialogTitle>
            <DialogDescription>
              {patientName} — preencha os dados do histórico clínico do paciente
            </DialogDescription>
          </DialogHeader>

          <AnamnesisForm
            patientId={patientId}
            anamnesis={anamnesis}
            onSuccess={() => {
              setOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
