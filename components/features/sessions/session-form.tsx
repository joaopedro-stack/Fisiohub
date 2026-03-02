'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { ClinicalSession } from '@/types'

const sessionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  physiotherapistId: z.string(),
  sessionNumber: z.number().min(1),
  notes: z.string().optional(),
  evolution: z.string().optional(),
  painLevel: z.number().min(0).max(10).optional(),
})

type SessionFormData = z.infer<typeof sessionSchema>

interface SessionFormProps {
  appointmentId: string
  patientId: string
  physiotherapistId: string
  appointmentDate: string | Date
  session?: ClinicalSession | null
  nextSessionNumber?: number
  onSuccess: () => void
}

const COMMON_TECHNIQUES = [
  'Cinesioterapia', 'Eletroterapia', 'Termoterapia', 'Crioterapia',
  'Ultrassom', 'TENS', 'Laser', 'Massoterapia', 'RPG', 'Pilates',
  'Hidroterapia', 'Acupuntura', 'Bandagem Funcional', 'Mobilização Articular',
]

export function SessionForm({
  appointmentId, patientId, physiotherapistId, appointmentDate, session, nextSessionNumber = 1, onSuccess,
}: SessionFormProps) {
  const [techniques, setTechniques] = useState<string[]>(session?.techniques ?? [])
  const [customTechnique, setCustomTechnique] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      appointmentId,
      patientId,
      physiotherapistId,
      sessionNumber: session?.sessionNumber ?? nextSessionNumber,
      notes: session?.notes ?? '',
      evolution: session?.evolution ?? '',
      painLevel: session?.painLevel ?? undefined,
    },
  })

  const toggleTechnique = (tech: string) => {
    setTechniques((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    )
  }

  const addCustomTechnique = () => {
    if (customTechnique.trim() && !techniques.includes(customTechnique.trim())) {
      setTechniques((prev) => [...prev, customTechnique.trim()])
      setCustomTechnique('')
    }
  }

  const onSubmit = async (data: SessionFormData) => {
    try {
      const url = session ? `/api/sessions/${session.id}` : '/api/sessions'
      const method = session ? 'PATCH' : 'POST'
      const date = new Date(appointmentDate).toISOString()

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          techniques,
          startTime: date,
          endTime: date,
        }),
      })

      if (!res.ok) throw new Error('Failed to save session')

      toast.success(session ? 'Sessão atualizada!' : 'Sessão registrada!')
      onSuccess()
    } catch {
      toast.error('Erro ao salvar sessão')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('appointmentId')} />
      <input type="hidden" {...register('patientId')} />
      <input type="hidden" {...register('physiotherapistId')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sessionNumber">Nº da Sessão</Label>
          <Input id="sessionNumber" type="number" readOnly disabled value={session?.sessionNumber ?? nextSessionNumber} className="bg-muted cursor-not-allowed" />
          <input type="hidden" {...register('sessionNumber', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Data do Atendimento</Label>
          <Input id="appointmentDate" readOnly disabled value={formatDate(new Date(appointmentDate))} className="bg-muted cursor-not-allowed" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Técnicas Utilizadas</Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TECHNIQUES.map((tech) => (
            <button
              key={tech}
              type="button"
              onClick={() => toggleTechnique(tech)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                techniques.includes(tech)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customTechnique}
            onChange={(e) => setCustomTechnique(e.target.value)}
            placeholder="Outra técnica..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechnique())}
          />
          <Button type="button" variant="outline" onClick={addCustomTechnique}>
            Adicionar
          </Button>
        </div>
        {techniques.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {techniques.map((tech) => (
              <Badge key={tech} variant="secondary" className="gap-1">
                {tech}
                <button type="button" onClick={() => toggleTechnique(tech)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="painLevel">Nível de Dor (0–10)</Label>
        <Input
          id="painLevel"
          type="number"
          min={0}
          max={10}
          {...register('painLevel', { valueAsNumber: true })}
          placeholder="0 = sem dor, 10 = dor máxima"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Anotações da Sessão</Label>
        <Textarea id="notes" {...register('notes')} rows={3} placeholder="Observações gerais, intercorrências..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evolution">Evolução do Paciente</Label>
        <Textarea id="evolution" {...register('evolution')} rows={4} placeholder="Descreva a evolução clínica do paciente..." />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {session ? 'Salvar alterações' : 'Registrar sessão'}
        </Button>
      </div>
    </form>
  )
}
