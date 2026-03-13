'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface OverdueItem {
  invoiceId: string
  patient: { id: string; name: string; phone?: string | null; email?: string | null }
  totalAmount: number
  netPaid: number
  outstanding: number
  dueDate: string
  daysOverdue: number
}

export function OverdueList() {
  const { data = [], isLoading } = useQuery<OverdueItem[]>({
    queryKey: ['finance-overdue'],
    queryFn: async () => {
      const res = await fetch('/api/finance/overdue')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const totalOutstanding = data.reduce((s, item) => s + item.outstanding, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{data.length} fatura(s) em atraso</span>
          <span className="font-semibold text-destructive">{formatBRL(totalOutstanding)} em aberto</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-10 w-10 opacity-20" />
              <p className="text-sm">Nenhuma fatura em atraso. Excelente!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Paciente</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Vencimento</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Pago</th>
                    <th className="text-right px-4 py-3 font-medium">Saldo</th>
                    <th className="text-center px-4 py-3 font-medium">Atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((item) => {
                    const isHighRisk = item.daysOverdue > 30
                    return (
                      <tr key={item.invoiceId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/patients/${item.patient.id}`}
                            className="font-medium hover:underline text-foreground"
                          >
                            {item.patient.name}
                          </Link>
                          {item.patient.phone && (
                            <p className="text-xs text-muted-foreground">{item.patient.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {item.dueDate ? formatDate(new Date(item.dueDate)) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatBRL(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                          {formatBRL(item.netPaid)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-destructive">
                          {formatBRL(item.outstanding)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={isHighRisk ? 'destructive' : 'outline'}
                            className={
                              !isHighRisk
                                ? 'border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                                : ''
                            }
                          >
                            {item.daysOverdue}d
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Loader2 className="inline h-3 w-3 mr-1" />
          Faturas em atraso são automaticamente marcadas ao abrir esta aba.
        </p>
      )}
    </div>
  )
}
