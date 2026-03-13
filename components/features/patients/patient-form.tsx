'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MapPin, CheckCircle2, XCircle } from 'lucide-react'
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

// ── CPF validation ──────────────────────────────────────────────────────────
function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false // all same digits

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === parseInt(cpf[10])
}

// ── Masks ───────────────────────────────────────────────────────────────────
function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{1,3})/, '$1-$2')
}

// ── ViaCEP response ─────────────────────────────────────────────────────────
interface ViaCEPResult {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

// ── Schema ──────────────────────────────────────────────────────────────────
const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional().refine(
    (val) => !val || val === '' || isValidCPF(val),
    'CPF inválido',
  ),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  healthInsurance: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  physiotherapistId: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

interface Physiotherapist { id: string; name: string }
interface PatientFormProps { patient?: Patient | null; onSuccess: () => void }

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const { user } = useCurrentUser()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'

  // CEP lookup state
  const [cepRaw, setCepRaw] = useState(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maskCEP((patient as any)?.cep ?? ''),
  )
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [addressLine, setAddressLine] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  })

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
      phone: patient?.phone ? maskPhone(patient.phone) : '',
      cpf: patient?.cpf ? maskCPF(patient.cpf) : '',
      birthDate: patient?.birthDate
        ? new Date(patient.birthDate).toISOString().split('T')[0]
        : '',
      gender: patient?.gender ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cep: (patient as any)?.cep ?? '',
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

  // On edit, parse existing address back into fields
  useEffect(() => {
    if (patient?.address) {
      setAddressLine(prev => ({ ...prev, logradouro: patient.address ?? '' }))
    }
  }, [patient])

  // ── CEP lookup ─────────────────────────────────────────────────────────────
  async function lookupCEP(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setCepStatus('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data: ViaCEPResult = await res.json()
      if (data.erro) {
        setCepStatus('error')
        toast.error('CEP não encontrado')
        return
      }
      setAddressLine(prev => ({
        ...prev,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
      }))
      setCepStatus('ok')
      // compose address immediately
      composeAddress({ logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf }, '', '')
    } catch {
      setCepStatus('error')
      toast.error('Erro ao buscar CEP')
    }
  }

  function composeAddress(
    parts: { logradouro: string; bairro: string; cidade: string; uf: string },
    numero: string,
    complemento: string,
  ) {
    const pieces = [
      parts.logradouro,
      numero ? `N° ${numero}` : null,
      complemento || null,
      parts.bairro,
      parts.cidade && parts.uf ? `${parts.cidade} - ${parts.uf}` : parts.cidade,
    ].filter(Boolean)
    setValue('address', pieces.join(', '))
  }

  // Recompose when any address part changes
  function handleAddressPartChange(field: keyof typeof addressLine, value: string) {
    const updated = { ...addressLine, [field]: value }
    setAddressLine(updated)
    composeAddress(updated, updated.numero, updated.complemento)
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      // Strip masks before sending
      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        phone: data.phone ? data.phone.replace(/\D/g, '') : undefined,
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
      }

      const url = patient ? `/api/patients/${patient.id}` : '/api/patients'
      const method = patient ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to save patient')
      }

      toast.success(patient ? 'Paciente atualizado!' : 'Paciente cadastrado!')
      onSuccess()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar paciente')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="(00) 00000-0000"
            value={watch('phone') ?? ''}
            onChange={(e) => setValue('phone', maskPhone(e.target.value))}
          />
        </div>

        {/* CPF */}
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={watch('cpf') ?? ''}
            onChange={(e) => setValue('cpf', maskCPF(e.target.value), { shouldValidate: true })}
          />
          {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input id="birthDate" type="date" {...register('birthDate')} />
        </div>

        {/* Gênero */}
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

        {/* Fisioterapeuta responsável */}
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── CEP ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="relative">
            <Input
              id="cep"
              placeholder="00000-000"
              value={cepRaw}
              onChange={(e) => {
                const masked = maskCEP(e.target.value)
                setCepRaw(masked)
                setValue('cep', masked)
                if (masked.replace(/\D/g, '').length < 8) {
                  setCepStatus('idle')
                }
              }}
              onBlur={() => lookupCEP(cepRaw)}
              className="pr-8"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {cepStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {cepStatus === 'ok'      && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {cepStatus === 'error'   && <XCircle className="h-4 w-4 text-destructive" />}
              {cepStatus === 'idle'    && <MapPin className="h-4 w-4" />}
            </div>
          </div>
        </div>

        {/* Número */}
        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            placeholder="123"
            value={addressLine.numero}
            onChange={(e) => handleAddressPartChange('numero', e.target.value)}
          />
        </div>

        {/* Logradouro (preenchido pelo CEP) */}
        <div className="space-y-2">
          <Label htmlFor="logradouro">Logradouro</Label>
          <Input
            id="logradouro"
            placeholder="Preenchido automaticamente"
            value={addressLine.logradouro}
            onChange={(e) => handleAddressPartChange('logradouro', e.target.value)}
          />
        </div>

        {/* Complemento */}
        <div className="space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            placeholder="Apto, bloco..."
            value={addressLine.complemento}
            onChange={(e) => handleAddressPartChange('complemento', e.target.value)}
          />
        </div>

        {/* Bairro */}
        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            placeholder="Preenchido automaticamente"
            value={addressLine.bairro}
            onChange={(e) => handleAddressPartChange('bairro', e.target.value)}
          />
        </div>

        {/* Cidade + UF */}
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade / UF</Label>
          <div className="flex gap-2">
            <Input
              id="cidade"
              placeholder="Cidade"
              className="flex-1"
              value={addressLine.cidade}
              onChange={(e) => handleAddressPartChange('cidade', e.target.value)}
            />
            <Input
              placeholder="UF"
              className="w-16"
              maxLength={2}
              value={addressLine.uf}
              onChange={(e) => handleAddressPartChange('uf', e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Plano de Saúde */}
        <div className="space-y-2">
          <Label htmlFor="healthInsurance">Plano de Saúde</Label>
          <Input id="healthInsurance" {...register('healthInsurance')} />
        </div>

        {/* Contato de Emergência */}
        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Contato de Emergência</Label>
          <Input
            id="emergencyContact"
            placeholder="Nome — (00) 00000-0000"
            {...register('emergencyContact')}
          />
        </div>

        {/* Observações */}
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
