'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-tenant'
import type { Patient } from '@/types'

const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  healthInsurance: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  physiotherapistId: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

interface Physiotherapist {
  id: string
  name: string
}

interface PatientFormProps {
  patient?: Patient | null
  onSuccess: () => void
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const { user } = useCurrentUser()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'

  const { data: physiotherapists } = useQuery<Physiotherapist[]>({
    queryKey: ['physiotherapists-list'],
    queryFn: async () => {
      const res = await fetch('/api/physiotherapists')
      if (!res.ok) throw new Error('Failed to fetch')
      const users: (Physiotherapist & { role: string })[] = await res.json()
      return users.filter((u) => ['PHYSIOTHERAPIST', 'ADMIN'].includes(u.role))
    },
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name ?? '',
      email: patient?.email ?? '',
      phone: patient?.phone ?? '',
      cpf: patient?.cpf ?? '',
      birthDate: patient?.birthDate
        ? new Date(patient.birthDate).toISOString().split('T')[0]
        : '',
      gender: patient?.gender ?? undefined,
      address: patient?.address ?? '',
      healthInsurance: patient?.healthInsurance ?? '',
      emergencyContact: patient?.emergencyContact ?? '',
      notes: patient?.notes ?? '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      physiotherapistId: (patient as any)?.physiotherapistId ?? undefined,
    },
  })

  const gender = watch('gender')
  const physiotherapistId = watch('physiotherapistId')

  const onSubmit = async (data: PatientFormData) => {
    try {
      const url = patient ? `/api/patients/${patient.id}` : '/api/patients'
      const method = patient ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to save patient')

      toast.success(patient ? 'Paciente atualizado!' : 'Paciente cadastrado!')
      onSuccess()
    } catch {
      toast.error('Erro ao salvar paciente')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register('phone')} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input id="birthDate" type="date" {...register('birthDate')} />
        </div>
        <div className="space-y-2">
          <Label>Gênero</Label>
          <Select value={gender} onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Masculino</SelectItem>
              <SelectItem value="FEMALE">Feminino</SelectItem>
              <SelectItem value="OTHER">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="space-y-2 md:col-span-2">
            <Label>Fisioterapeuta responsável</Label>
            <Select
              value={physiotherapistId ?? ''}
              onValueChange={(v) => setValue('physiotherapistId', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                {physiotherapists?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...register('address')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="healthInsurance">Plano de Saúde</Label>
          <Input id="healthInsurance" {...register('healthInsurance')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Contato de Emergência</Label>
          <Input id="emergencyContact" {...register('emergencyContact')} placeholder="Nome — (00) 00000-0000" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" {...register('notes')} rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {patient ? 'Salvar alterações' : 'Cadastrar paciente'}
        </Button>
      </div>
    </form>
  )
}
