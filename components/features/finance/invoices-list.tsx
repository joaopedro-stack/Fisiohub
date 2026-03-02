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
import { toast } from 'sonner'
import { CreditCard, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Em Aberto',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELED: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'secondary',
  PAID: 'default',
  OVERDUE: 'destructive',
  CANCELED: 'outline',
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CARD: 'Cartão',
  INSURANCE: 'Convênio',
  OTHER: 'Outro',
}

interface Invoice {
  id: string
  patientId: string
  totalAmount: number
  issuedAt: string
  dueDate?: string | null
  status: string
  effectiveStatus: string
  netPaid: number
  notes?: string | null
  patient: { id: string; name: string }
}

export function InvoicesList() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'PIX', notes: '' })

  const statusParam = statusFilter === 'all' ? '' : statusFilter

  const { data, isLoading } = useQuery<{ data: Invoice[]; total: number; limit: number }>({
    queryKey: ['invoices', page, statusFilter],
    queryFn: () => fetch(`/api/invoices?page=${page}&limit=15${statusParam ? `&status=${statusParam}` : ''}`).then((r) => r.json()),
  })

  const addPayment = useMutation({
    mutationFn: (vars: { invoiceId: string; amount: number; method: string; notes: string }) =>
      fetch(`/api/invoices/${vars.invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: vars.amount, method: vars.method, notes: vars.notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Pagamento registrado')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPaymentDialogOpen(false)
      setPaymentForm({ amount: '', method: 'PIX', notes: '' })
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  })

  const cancelInvoice = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELED' }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Fatura cancelada')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setCancelDialogOpen(false)
    },
    onError: () => toast.error('Erro ao cancelar fatura'),
  })

  const invoices = data?.data ?? []
  const total = data?.total ?? 0
  const limit = data?.limit ?? 15
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="OPEN">Em Aberto</SelectItem>
            <SelectItem value="PAID">Pagos</SelectItem>
            <SelectItem value="CANCELED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} fatura(s)</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma fatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Paciente</th>
                    <th className="text-left px-4 py-3 font-medium">Emitida</th>
                    <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-right px-4 py-3 font-medium">Pago</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{inv.patient.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(new Date(inv.issuedAt))}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.dueDate ? formatDate(new Date(inv.dueDate)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatBRL(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(inv.netPaid)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={STATUS_VARIANTS[inv.effectiveStatus] ?? 'secondary'}>
                          {STATUS_LABELS[inv.effectiveStatus] ?? inv.effectiveStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {inv.effectiveStatus !== 'PAID' && inv.effectiveStatus !== 'CANCELED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setSelectedInvoice(inv); setPaymentForm({ amount: String(inv.totalAmount - inv.netPaid), method: 'PIX', notes: '' }); setPaymentDialogOpen(true) }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          {inv.effectiveStatus !== 'CANCELED' && inv.effectiveStatus !== 'PAID' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setSelectedInvoice(inv); setCancelDialogOpen(true) }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Payment dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvoice && (
              <p className="text-sm text-muted-foreground">
                Fatura de <strong>{selectedInvoice.patient.name}</strong> — {formatBRL(selectedInvoice.totalAmount)}
                {selectedInvoice.netPaid > 0 && ` (já pago: ${formatBRL(selectedInvoice.netPaid)})`}
              </p>
            )}
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
            <Button
              disabled={!paymentForm.amount || addPayment.isPending}
              onClick={() => {
                if (!selectedInvoice) return
                addPayment.mutate({
                  invoiceId: selectedInvoice.id,
                  amount: parseFloat(paymentForm.amount),
                  method: paymentForm.method,
                  notes: paymentForm.notes,
                })
              }}
            >
              {addPayment.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Fatura</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja cancelar a fatura de <strong>{selectedInvoice?.patient.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Voltar</Button>
            <Button
              variant="destructive"
              disabled={cancelInvoice.isPending}
              onClick={() => selectedInvoice && cancelInvoice.mutate(selectedInvoice.id)}
            >
              {cancelInvoice.isPending ? 'Cancelando...' : 'Cancelar Fatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
