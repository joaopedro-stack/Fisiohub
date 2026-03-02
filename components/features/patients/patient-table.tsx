'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-dialog'
import { PatientForm } from './patient-form'
import { useRouter } from 'next/navigation'
import type { Patient, User } from '@/types'
import { useCurrentUser } from '@/hooks/use-tenant'

async function fetchPatients(search?: string, physiotherapistId?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (physiotherapistId) params.set('physiotherapistId', physiotherapistId)
  const res = await fetch(`/api/patients?${params}`)
  if (!res.ok) throw new Error('Failed to fetch patients')
  return res.json() as Promise<{ patients: Patient[]; total: number }>
}

async function fetchPhysiotherapists() {
  const res = await fetch('/api/physiotherapists')
  if (!res.ok) throw new Error('Failed to fetch physiotherapists')
  return res.json() as Promise<User[]>
}

async function deletePatient(id: string) {
  const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete patient')
}

const genderLabel: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
}

export function PatientTable() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPhysioId, setSelectedPhysioId] = useState<string | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user } = useCurrentUser()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'

  const { data, isLoading } = useQuery({
    queryKey: ['patients', debouncedSearch, selectedPhysioId],
    queryFn: () => fetchPatients(debouncedSearch, selectedPhysioId),
  })

  const { data: physiotherapists } = useQuery({
    queryKey: ['physiotherapists'],
    queryFn: fetchPhysiotherapists,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      setPatientToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente removido com sucesso')
    },
    onError: () => toast.error('Erro ao remover paciente'),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout(window.__searchTimeout)
    window.__searchTimeout = setTimeout(() => setDebouncedSearch(value), 400)
  }

  const selectedPhysio = physiotherapists?.find((p) => p.id === selectedPhysioId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 gap-2">
                  {selectedPhysio ? selectedPhysio.name : 'Fisioterapeuta'}
                  {selectedPhysio ? (
                    <X
                      className="h-3.5 w-3.5 text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); setSelectedPhysioId(undefined) }}
                    />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedPhysioId(undefined)}>
                  Todos
                </DropdownMenuItem>
                {physiotherapists?.filter((p) => p.role === 'PHYSIOTHERAPIST').map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setSelectedPhysioId(p.id)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Button onClick={() => { setEditPatient(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Gênero</TableHead>
              {isAdmin && <TableHead>Fisioterapeuta</TableHead>}
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !data?.patients?.length ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-actions]')) return
                    router.push(`/patients/${patient.id}`)
                  }}
                >
                  <TableCell>
                    <span className="font-medium">{patient.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.email ?? '—'}</TableCell>
                  <TableCell>{patient.phone ?? '—'}</TableCell>
                  <TableCell>
                    {patient.gender ? (
                      <Badge variant="outline">{genderLabel[patient.gender]}</Badge>
                    ) : '—'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-muted-foreground">
                      {patient.physiotherapist?.name ?? '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {format(new Date(patient.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell data-actions>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditPatient(patient); setShowForm(true) }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setPatientToDelete(patient.id) }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} paciente{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
        </p>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={editPatient}
            onSuccess={() => {
              setShowForm(false)
              queryClient.invalidateQueries({ queryKey: ['patients'] })
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!patientToDelete}
        onOpenChange={(open) => { if (!open) setPatientToDelete(null) }}
        onConfirm={() => { if (patientToDelete) deleteMutation.mutate(patientToDelete) }}
        isPending={deleteMutation.isPending}
        title="Remover paciente"
        description="Tem certeza que deseja remover este paciente? Esta ação não pode ser desfeita."
      />
    </div>
  )
}

declare global {
  interface Window { __searchTimeout: ReturnType<typeof setTimeout> }
}
