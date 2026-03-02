'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Anamnesis } from '@/types'

const schema = z.object({
  chiefComplaint: z.string().optional(),
  history:        z.string().optional(),
  medications:    z.string().optional(),
  allergies:      z.string().optional(),
  surgeries:      z.string().optional(),
  familyHistory:  z.string().optional(),
  lifestyle:      z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AnamnesisFormProps {
  patientId: string
  anamnesis?: Anamnesis | null
  onSuccess: () => void
}

const FIELDS: { key: keyof FormData; label: string; placeholder: string; rows: number; colSpan?: boolean }[] = [
  {
    key: 'chiefComplaint',
    label: 'Queixa Principal',
    placeholder: 'Descreva o motivo principal da consulta — dor, limitação de movimento, lesão...',
    rows: 3,
    colSpan: true,
  },
  {
    key: 'history',
    label: 'Histórico Clínico',
    placeholder: 'Histórico da doença atual, tratamentos anteriores, tempo de evolução...',
    rows: 4,
    colSpan: true,
  },
  {
    key: 'medications',
    label: 'Medicamentos em Uso',
    placeholder: 'Liste os medicamentos em uso contínuo ou recente...',
    rows: 3,
  },
  {
    key: 'allergies',
    label: 'Alergias',
    placeholder: 'Alergias a medicamentos, látex, materiais...',
    rows: 3,
  },
  {
    key: 'surgeries',
    label: 'Cirurgias Anteriores',
    placeholder: 'Cirurgias realizadas, ano aproximado, local...',
    rows: 3,
  },
  {
    key: 'familyHistory',
    label: 'Histórico Familiar',
    placeholder: 'Doenças relevantes na família (artrite, diabetes, doenças cardíacas)...',
    rows: 3,
  },
  {
    key: 'lifestyle',
    label: 'Estilo de Vida',
    placeholder: 'Ocupação, atividade física, horas de sono, alimentação, tabagismo, álcool...',
    rows: 3,
    colSpan: true,
  },
]

export function AnamnesisForm({ patientId, anamnesis, onSuccess }: AnamnesisFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      chiefComplaint: anamnesis?.chiefComplaint ?? '',
      history:        anamnesis?.history ?? '',
      medications:    anamnesis?.medications ?? '',
      allergies:      anamnesis?.allergies ?? '',
      surgeries:      anamnesis?.surgeries ?? '',
      familyHistory:  anamnesis?.familyHistory ?? '',
      lifestyle:      anamnesis?.lifestyle ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`/api/anamnesis/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success(anamnesis ? 'Anamnese atualizada!' : 'Anamnese registrada!')
      onSuccess()
    } catch {
      toast.error('Erro ao salvar anamnese')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, placeholder, rows, colSpan }) => (
          <div
            key={key}
            className={`space-y-1.5 ${colSpan ? 'md:col-span-2' : ''}`}
          >
            <Label htmlFor={key} className="text-sm font-medium">
              {label}
            </Label>
            <Textarea
              id={key}
              {...register(key)}
              rows={rows}
              placeholder={placeholder}
              className="resize-none text-sm transition-all hover:border-primary/50 focus:border-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            anamnesis ? 'Salvar alterações' : 'Registrar anamnese'
          )}
        </Button>
      </div>
    </form>
  )
}
