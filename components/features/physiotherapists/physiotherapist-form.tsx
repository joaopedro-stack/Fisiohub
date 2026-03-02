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
import type { User } from '@/types'

// Always use the same schema, password is always present but optional on edit
const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PHYSIOTHERAPIST', 'RECEPTIONIST']),
})

type FormData = z.infer<typeof schema>

interface PhysiotherapistFormProps {
  user?: User | null
  onSuccess: () => void
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PHYSIOTHERAPIST: 'Fisioterapeuta',
  RECEPTIONIST: 'Recepcionista',
}

export function PhysiotherapistForm({ user, onSuccess }: PhysiotherapistFormProps) {
  const userRole = user?.role === 'SUPER_ADMIN' ? 'ADMIN' : (user?.role as 'ADMIN' | 'PHYSIOTHERAPIST' | 'RECEPTIONIST' | undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      phone: user?.phone ?? '',
      role: userRole ?? 'PHYSIOTHERAPIST',
    },
  })

  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    try {
      const url = user ? `/api/physiotherapists/${user.id}` : '/api/physiotherapists'
      const method = user ? 'PATCH' : 'POST'

      // For create, password is required; for edit, only send if provided
      if (!user && !data.password) {
        toast.error('Senha é obrigatória para novo usuário')
        return
      }

      const body = user && !data.password
        ? { name: data.name, email: data.email, phone: data.phone, role: data.role }
        : data

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      toast.success(user ? 'Usuário atualizado!' : 'Usuário criado!')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
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
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register('phone')} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label>Perfil</Label>
          <Select
            value={role}
            onValueChange={(v) => setValue('role', v as 'ADMIN' | 'PHYSIOTHERAPIST' | 'RECEPTIONIST')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="password">
            {user ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
          </Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? 'Salvar alterações' : 'Criar usuário'}
        </Button>
      </div>
    </form>
  )
}
