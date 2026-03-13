'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PatientForm } from './patient-form'
import type { Patient } from '@/types'

export function PatientEditButton({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        Editar paciente
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Editar Paciente</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6 mt-4">
            <PatientForm
              patient={patient}
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
