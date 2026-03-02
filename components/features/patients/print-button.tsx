'use client'

import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrintButtonProps {
  patientId: string
}

export function PrintButton({ patientId }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/patients/${patientId}/pdf`, '_blank')}
    >
      <FileDown className="h-3.5 w-3.5 mr-1.5" />
      Baixar PDF
    </Button>
  )
}
