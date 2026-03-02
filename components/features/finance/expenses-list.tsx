'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, CheckCircle2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const CATEGORY_LABELS: Record<string, string> = {
  RENT: 'Aluguel',
  SALARY: 'Salários',
  SUPPLIES: 'Materiais',
  EQUIPMENT: 'Equipamentos',
  UTILITIES: 'Utilidades',
  MARKETING: 'Marketing',
  TAXES: 'Impostos',
  OTHER: 'Outros',
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  dueDate: string
  paidAt?: string | null
  status: string
  isRecurring: boolean
  recurrenceRule?: string | null
}

const INITIAL_FORM = {
  description: '',
  category: 'OTHER',
  amount: '',
  dueDate: '',
  isRecurring: false,
  recurrenceRule: 'monthly',
}

export function ExpensesList() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  const statusParam = statusFilter === 'all' ? '' : statusFilter
  const categoryParam = categoryFilter === 'all' ? '' : categoryFilter

  const { data, isLoading } = useQuery<{ data: Expense[]; total: number; limit: number }>({
    queryKey: ['expenses', page, statusFilter, categoryFilter],
    queryFn: () =>
      fetch(`/api/expenses?page=${page}&limit=15${statusParam ? `&status=${statusParam}` : ''}${categoryParam ? `&category=${categoryParam}` : ''}`).then((r) => r.json()),
  })

  const createExpense = useMutation({
    mutationFn: (body: typeof INITIAL_FORM) =>
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: body.description,
          category: body.category,
          amount: parseFloat(body.amount),
          dueDate: body.dueDate,
          isRecurring: body.isRecurring,
          recurrenceRule: body.isRecurring ? body.recurrenceRule : undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Despesa criada')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setCreateOpen(false)
      setForm(INITIAL_FORM)
    },
    onError: () => toast.error('Erro ao criar despesa'),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Despesa marcada como paga')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => toast.error('Erro ao atualizar despesa'),
  })

  const deleteExpense = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/expenses/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Despesa removida')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => toast.error('Erro ao remover despesa'),
  })

  const expenses = data?.data ?? []
  const total = data?.total ?? 0
  const limit = data?.limit ?? 15
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} despesa(s)</span>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Despesa
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma despesa encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium">{exp.description}</span>
                        {exp.isRecurring && (
                          <span className="ml-2 text-xs text-muted-foreground">(recorrente)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {CATEGORY_LABELS[exp.category] ?? exp.category}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(new Date(exp.dueDate))}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatBRL(exp.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={exp.status === 'PAID' ? 'default' : 'secondary'}>
                          {exp.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {exp.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Marcar como pago"
                              onClick={() => markPaid.mutate(exp.id)}
                              disabled={markPaid.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteExpense.mutate(exp.id)}
                            disabled={deleteExpense.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Aluguel sala"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="recurring"
                checked={form.isRecurring}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
              />
              <Label htmlFor="recurring">Despesa recorrente (mensal)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setForm(INITIAL_FORM) }}>Cancelar</Button>
            <Button
              disabled={!form.description || !form.amount || !form.dueDate || createExpense.isPending}
              onClick={() => createExpense.mutate(form)}
            >
              {createExpense.isPending ? 'Salvando...' : 'Criar Despesa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
