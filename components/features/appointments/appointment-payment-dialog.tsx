'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CreditCard, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import type { Appointment } from '@/types'

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CARD: 'Cartão',
  INSURANCE: 'Convênio',
  OTHER: 'Outro',
}

interface InvoiceData {
  id: string
  totalAmount: number
  netPaid: number
  status: string
  isInsurance: boolean
  installments: { id: string; number: number; amount: number; dueDate: string; paidAt: string | null; method: string | null }[]
  payments: { id: string; amount: number; method: string; paidAt: string; isRefund: boolean }[]
}

interface Props {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentPaymentDialog({ appointment, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(() =>
    appointment.paymentValue != null ? String(appointment.paymentValue) : ''
  )
  const [method, setMethod] = useState('PIX')
  const [notes, setNotes] = useState('')
  const [showInstallSheet, setShowInstallSheet] = useState(false)
  const [installCount, setInstallCount] = useState('2')
  const [installStartDate, setInstallStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showInstallDialog, setShowInstallDialog] = useState(false)

  const { data: invoice, isLoading: invoiceLoading } = useQuery<InvoiceData>({
    queryKey: ['appointment-invoice', appointment.id],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/${appointment.id}/invoice`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: open,
  })

  const payMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/appointments/${appointment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method, notes: notes || undefined }),
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json()
          throw new Error(err.error ?? 'Erro ao registrar pagamento')
        }
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Pagamento registrado!')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-invoice', appointment.id] })
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createInstallments = useMutation({
    mutationFn: async ({ invoiceId, count, startDate }: { invoiceId: string; count: number; startDate: string }) => {
      // If no invoice yet, pay first to create it, then install
      const res = await fetch(`/api/invoices/${invoiceId}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, startDate }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Parcelamento criado!')
      queryClient.invalidateQueries({ queryKey: ['appointment-invoice', appointment.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setShowInstallDialog(false)
      setShowInstallSheet(true)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleInstallPaid = useMutation({
    mutationFn: ({ installmentId, paid }: { installmentId: string; paid: boolean }) =>
      fetch(`/api/invoices/${invoice!.id}/installments/${installmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid, method: 'PIX' }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Parcela atualizada!')
      queryClient.invalidateQueries({ queryKey: ['appointment-invoice', appointment.id] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: () => toast.error('Erro ao atualizar parcela'),
  })

  const remaining = invoice ? invoice.totalAmount - invoice.netPaid : parseFloat(amount) || 0
  // Use appointment.paymentStatus as the primary guard (available immediately, no loading required)
  const apptPaymentStatus = (appointment as unknown as { paymentStatus?: string }).paymentStatus
  const isAlreadyPaid = apptPaymentStatus === 'PAID' || apptPaymentStatus === 'WAIVED' || invoice?.status === 'PAID'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamento da Consulta
            </DialogTitle>
          </DialogHeader>

          {invoiceLoading ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paciente: <strong>{appointment.patient?.name}</strong>
              </p>

              {invoice && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total da fatura</span>
                    <span className="font-medium">{formatBRL(invoice.totalAmount)}</span>
                  </div>
                  {invoice.netPaid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Já pago</span>
                      <span className="font-medium text-emerald-600">{formatBRL(invoice.netPaid)}</span>
                    </div>
                  )}
                  {!isAlreadyPaid && (
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-muted-foreground">Saldo restante</span>
                      <span className="font-bold text-destructive">{formatBRL(remaining)}</span>
                    </div>
                  )}
                </div>
              )}

              {isAlreadyPaid ? (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  Esta consulta já foi integralmente paga.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={invoice ? formatBRL(remaining) : '0,00'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(METHOD_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </>
              )}

              {invoice && invoice.installments.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowInstallSheet(true)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Ver parcelas ({invoice.installments.length})
                </Button>
              )}

              {invoice && invoice.installments.length === 0 && !isAlreadyPaid && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowInstallDialog(true)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Parcelar
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            {!isAlreadyPaid && (
              <Button
                disabled={!amount || parseFloat(amount) <= 0 || payMutation.isPending || invoiceLoading}
                onClick={() => payMutation.mutate()}
              >
                {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Installments sheet */}
      <Sheet open={showInstallSheet} onOpenChange={setShowInstallSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Parcelamento</SheetTitle>
          </SheetHeader>
          {invoice && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatBRL(invoice.totalAmount)}</span>
              </div>
              {invoice.installments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela criada.</p>
              ) : (
                <div className="space-y-2">
                  {invoice.installments.map((inst) => {
                    const isPaid = !!inst.paidAt
                    return (
                      <div
                        key={inst.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          isPaid
                            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200/60 dark:border-green-800/40'
                            : 'bg-muted/30',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleInstallPaid.mutate({ installmentId: inst.id, paid: !isPaid })}
                            className="shrink-0"
                          >
                            <span className={cn(
                              'inline-flex items-center justify-center w-5 h-5 rounded-full border-2 text-xs transition-colors',
                              isPaid
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-muted-foreground/40',
                            )}>
                              {isPaid ? '✓' : ''}
                            </span>
                          </button>
                          <div>
                            <p className="text-sm font-medium">Parcela {inst.number}</p>
                            <p className="text-xs text-muted-foreground">
                              Venc: {formatDate(new Date(inst.dueDate))}
                              {isPaid && inst.paidAt && ` · Pago em ${formatDate(new Date(inst.paidAt))}`}
                            </p>
                          </div>
                        </div>
                        <span className={cn('text-sm font-semibold tabular-nums', isPaid && 'text-green-700 dark:text-green-400')}>
                          {formatBRL(inst.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              <Badge variant="outline" className="text-xs w-full justify-center">
                {formatBRL(invoice.netPaid)} pago de {formatBRL(invoice.totalAmount)}
              </Badge>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create installment dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Parcelamento</DialogTitle>
          </DialogHeader>
          {invoice && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fatura de <strong>{formatBRL(invoice.totalAmount)}</strong>
              </p>
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Select value={installCount} onValueChange={setInstallCount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x de {formatBRL(invoice.totalAmount / n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primeira parcela</Label>
                <Input type="date" value={installStartDate} onChange={(e) => setInstallStartDate(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>Cancelar</Button>
            <Button
              disabled={!invoice || createInstallments.isPending}
              onClick={() => {
                if (!invoice) return
                createInstallments.mutate({
                  invoiceId: invoice.id,
                  count: parseInt(installCount, 10),
                  startDate: installStartDate,
                })
              }}
            >
              {createInstallments.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
