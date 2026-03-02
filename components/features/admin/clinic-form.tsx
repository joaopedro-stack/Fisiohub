'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const clinicSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
})

type ClinicFormData = z.infer<typeof clinicSchema>

export function ClinicForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { plan: 'BASIC' },
  })

  const plan = watch('plan')

  const onSubmit = async (data: ClinicFormData) => {
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }

      toast.success('Clínica criada com sucesso!')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar clínica')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Dados da Clínica</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Clínica *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (subdomínio) *</Label>
          <Input id="slug" {...register('slug')} placeholder="clinica-joao" />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="space-y-2">
          <Label>Plano</Label>
          <Select value={plan} onValueChange={(v) => setValue('plan', v as ClinicFormData['plan'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASIC">Básico</SelectItem>
              <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...register('address')} />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground pt-2">Administrador Inicial</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminName">Nome *</Label>
          <Input id="adminName" {...register('adminName')} />
          {errors.adminName && <p className="text-sm text-destructive">{errors.adminName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email *</Label>
          <Input id="adminEmail" type="email" {...register('adminEmail')} />
          {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="adminPassword">Senha *</Label>
          <Input id="adminPassword" type="password" {...register('adminPassword')} />
          {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Clínica
        </Button>
      </div>
    </form>
  )
}
