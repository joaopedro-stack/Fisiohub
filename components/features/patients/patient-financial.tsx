'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Loader2, CreditCard, ChevronDown, ChevronUp, Layers,
  CheckCircle2, Circle, DollarSign, TrendingUp, TrendingDown, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate, cn } from '@/lib/utils'

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

interface Installment {
  id: string
  number: number
  amount: number
  dueDate: string
  paidAt: string | null
  method: string | null
  notes: string | null
}

interface InvoiceDetail {
  id: string
  totalAmount: number
  netPaid: number
  status: string
  effectiveStatus: string
  issuedAt: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  appointmentsCount: number
  payments: {
    id: string
    amount: number
    method: string
    paidAt: string
    isRefund: boolean
    notes: string | null
  }[]
  installments: Installment[]
}

interface FinancialSummary {
  totalBilled: number
  totalPaid: number
  balance: number
  overdueAmount: number
  invoices: InvoiceDetail[]
}

interface Props {
  patientId: string
}

export function PatientFinancial({ patientId }: Props) {
  const queryClient = useQueryClient()
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [installmentsSheet, setInstallmentsSheet] = useState<InvoiceDetail | null>(null)
  const [installmentDialog, setInstallmentDialog] = useState<InvoiceDetail | null>(null)
  const [installCount, setInstallCount] = useState('2')
  const [installStartDate, setInstallStartDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })

  const { data, isLoading } = useQuery<FinancialSummary>({
    queryKey: ['patient-financial', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/financial`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const createInstallments = useMutation({
    mutationFn: async ({ invoiceId, count, startDate }: { invoiceId: string; count: number; startDate: string }) => {
      const res = await fetch(`/api/invoices/${invoiceId}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, startDate }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao criar parcelamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-financial', patientId] })
      toast.success('Parcelamento criado!')
      setInstallmentDialog(null)
      // Refresh installments sheet if open
      if (installmentsSheet) {
        setInstallmentsSheet(null)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['patient-financial', patientId] })
        }, 300)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleInstallmentPaid = useMutation({
    mutationFn: async ({
      invoiceId,
      installmentId,
      paid,
      method,
    }: {
      invoiceId: string
      installmentId: string
      paid: boolean
      method?: string
    }) => {
      const res = await fetch(`/api/invoices/${invoiceId}/installments/${installmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid, method }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-financial', patientId] })
      toast.success('Parcela atualizada!')
    },
    onError: () => toast.error('Erro ao atualizar parcela'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando dados financeiros…
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Erro ao carregar dados financeiros.</p>
  }

  const invoices = data.invoices

  // Reflect the latest installments from current data after sheet is open
  const sheetInvoice = installmentsSheet
    ? invoices.find((inv) => inv.id === installmentsSheet.id) ?? installmentsSheet
    : null

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Cobrado</p>
                <p className="font-bold tabular-nums text-sm">{formatBRL(data.totalBilled)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pago</p>
                <p className="font-bold tabular-nums text-sm">{formatBRL(data.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(data.balance > 0 && 'border-red-300/60 dark:border-red-700/40')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                data.balance > 0
                  ? 'bg-red-50 dark:bg-red-950'
                  : 'bg-muted',
              )}>
                <TrendingDown className={cn(
                  'h-4 w-4',
                  data.balance > 0 ? 'text-destructive' : 'text-muted-foreground',
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                <p className={cn(
                  'font-bold tabular-nums text-sm',
                  data.balance > 0 ? 'text-destructive' : 'text-muted-foreground',
                )}>
                  {formatBRL(data.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(data.overdueAmount > 0 && 'border-orange-300/60 dark:border-orange-700/40')}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                data.overdueAmount > 0
                  ? 'bg-orange-50 dark:bg-orange-950'
                  : 'bg-muted',
              )}>
                <AlertTriangle className={cn(
                  'h-4 w-4',
                  data.overdueAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground',
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Atraso</p>
                <p className={cn(
                  'font-bold tabular-nums text-sm',
                  data.overdueAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground',
                )}>
                  {formatBRL(data.overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
            <CreditCard className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhuma fatura para este paciente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Faturas ({invoices.length})
          </h3>
          {invoices.map((inv) => {
            const isExpanded = expandedInvoice === inv.id
            return (
              <Card key={inv.id} className={cn(
                'overflow-hidden transition-all',
                inv.effectiveStatus === 'OVERDUE' && 'border-destructive/30',
              )}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm font-semibold">
                          Fatura — {formatDate(new Date(inv.issuedAt))}
                        </CardTitle>
                        <Badge variant={STATUS_VARIANTS[inv.effectiveStatus] ?? 'secondary'} className="text-xs">
                          {STATUS_LABELS[inv.effectiveStatus] ?? inv.effectiveStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.appointmentsCount} sessão(ões)
                        {inv.dueDate && ` · Vencimento: ${formatDate(new Date(inv.dueDate))}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatBRL(inv.totalAmount)}</p>
                      {inv.netPaid > 0 && (
                        <p className="text-xs text-muted-foreground">Pago: {formatBRL(inv.netPaid)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {inv.installments.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setInstallmentsSheet(inv)}
                      >
                        <Layers className="h-3 w-3" />
                        {inv.installments.length} parcela(s)
                      </Button>
                    )}
                    {inv.effectiveStatus !== 'CANCELED' && inv.effectiveStatus !== 'PAID' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setInstallmentDialog(inv); setInstallCount('2'); }}
                      >
                        <Layers className="h-3 w-3" />
                        {inv.installments.length > 0 ? 'Reparcelar' : 'Parcelar'}
                      </Button>
                    )}
                    {inv.payments.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 ml-auto"
                        onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Pagamentos
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Expanded payments */}
                {isExpanded && inv.payments.length > 0 && (
                  <CardContent className="pt-0 pb-3 px-4 border-t">
                    <ul className="space-y-1.5 mt-3">
                      {inv.payments.map((p) => (
                        <li key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {formatDate(new Date(p.paidAt))} · {METHOD_LABELS[p.method] ?? p.method}
                            {p.isRefund && <span className="text-destructive ml-1">(estorno)</span>}
                          </span>
                          <span className={cn('font-medium', p.isRefund && 'text-destructive')}>
                            {p.isRefund ? '-' : ''}{formatBRL(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Installments sheet */}
      <Sheet open={!!sheetInvoice} onOpenChange={(open) => { if (!open) setInstallmentsSheet(null) }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Parcelamento</SheetTitle>
          </SheetHeader>
          {sheetInvoice && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total da fatura</span>
                <span className="font-bold">{formatBRL(sheetInvoice.totalAmount)}</span>
              </div>
              <div className="space-y-2">
                {sheetInvoice.installments.map((inst) => {
                  const isPaid = !!inst.paidAt
                  return (
                    <div
                      key={inst.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        isPaid ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200/60 dark:border-green-800/40' : 'bg-muted/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          className="shrink-0"
                          onClick={() => toggleInstallmentPaid.mutate({
                            invoiceId: sheetInvoice.id,
                            installmentId: inst.id,
                            paid: !isPaid,
                            method: !isPaid ? 'PIX' : undefined,
                          })}
                        >
                          {isPaid
                            ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            : <Circle className="h-5 w-5 text-muted-foreground" />
                          }
                        </button>
                        <div>
                          <p className="text-sm font-medium">Parcela {inst.number}</p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {formatDate(new Date(inst.dueDate))}
                            {isPaid && inst.paidAt && ` · Pago em ${formatDate(new Date(inst.paidAt))}`}
                            {isPaid && inst.method && ` · ${METHOD_LABELS[inst.method] ?? inst.method}`}
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
              <p className="text-xs text-muted-foreground">
                Clique no círculo para marcar/desmarcar uma parcela como paga (forma de pagamento padrão: PIX).
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create installment dialog */}
      <Dialog open={!!installmentDialog} onOpenChange={(open) => { if (!open) setInstallmentDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Parcelamento</DialogTitle>
          </DialogHeader>
          {installmentDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fatura de <strong>{formatBRL(installmentDialog.totalAmount)}</strong>.
                {installmentDialog.installments.length > 0 && (
                  <span className="text-amber-600 ml-1">O parcelamento atual será substituído.</span>
                )}
              </p>
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Select value={installCount} onValueChange={setInstallCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => {
                      const amount = installmentDialog.totalAmount / n
                      return (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de {formatBRL(amount)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primeira parcela</Label>
                <Input
                  type="date"
                  value={installStartDate}
                  onChange={(e) => setInstallStartDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentDialog(null)}>Cancelar</Button>
            <Button
              disabled={createInstallments.isPending}
              onClick={() => {
                if (!installmentDialog) return
                createInstallments.mutate({
                  invoiceId: installmentDialog.id,
                  count: parseInt(installCount, 10),
                  startDate: installStartDate,
                })
              }}
            >
              {createInstallments.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar parcelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
