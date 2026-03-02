'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Users, MoreHorizontal, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClinicForm } from '@/components/features/admin/clinic-form'
import type { Clinic } from '@/types'

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  PROFESSIONAL: 'Profissional',
  ENTERPRISE: 'Enterprise',
}

const PLAN_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  BASIC: 'outline',
  PROFESSIONAL: 'default',
  ENTERPRISE: 'secondary',
}

async function fetchClinics() {
  const res = await fetch('/api/admin/clinics')
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<Clinic[]>
}

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: fetchClinics,
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/clinics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] })
      toast.success('Clínica atualizada')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-muted-foreground">Gerencie todas as clínicas da plataforma</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Clínica
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Clínicas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{clinics.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Clínicas Ativas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{clinics.filter((c) => c.isActive).length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Plano Enterprise</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{clinics.filter((c) => c.plan === 'ENTERPRISE').length}</p></CardContent>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell>
              </TableRow>
            ) : clinics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma clínica cadastrada</TableCell>
              </TableRow>
            ) : (
              clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium">{clinic.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 rounded">{clinic.slug}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{clinic.email}</TableCell>
                  <TableCell>
                    <Badge variant={PLAN_VARIANTS[clinic.plan] ?? 'outline'}>
                      {PLAN_LABELS[clinic.plan] ?? clinic.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={clinic.isActive ? 'default' : 'destructive'}>
                      {clinic.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(clinic.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleMutation.mutate({ id: clinic.id, isActive: !clinic.isActive })}
                        >
                          {clinic.isActive ? 'Desativar' : 'Ativar'}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Clínica</DialogTitle>
          </DialogHeader>
          <ClinicForm
            onSuccess={() => {
              setShowForm(false)
              queryClient.invalidateQueries({ queryKey: ['admin-clinics'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
