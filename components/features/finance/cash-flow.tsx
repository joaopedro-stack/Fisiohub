'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface CashFlowEntry {
  month: string
  monthLabel: string
  revenue: number
  expenses: number
  balance: number
  accumulated: number
}

interface Props {
  from: string
  to: string
}

export function CashFlow({ from, to }: Props) {
  const { data, isLoading } = useQuery<{ data: CashFlowEntry[] }>({
    queryKey: ['finance-cashflow', from, to],
    queryFn: () => fetch(`/api/finance/cashflow?from=${from}&to=${to}`).then((r) => r.json()),
  })

  const entries = data?.data ?? []
  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0)
  const totalExpenses = entries.reduce((s, e) => s + e.expenses, 0)
  const totalBalance = totalRevenue - totalExpenses
  const maxVal = Math.max(...entries.map((e) => Math.max(e.revenue, e.expenses)), 1)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatBRL(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${totalBalance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                <DollarSign className={`h-5 w-5 ${totalBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatBRL(totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum dado financeiro no período selecionado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entradas e Saídas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium capitalize">{entry.monthLabel}</span>
                    <span className={entry.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {entry.balance >= 0 ? '+' : ''}{formatBRL(entry.balance)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* Revenue bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-emerald-600">Receita</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(entry.revenue / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 text-xs text-right">{formatBRL(entry.revenue)}</span>
                    </div>
                    {/* Expense bar */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-red-600">Despesa</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all"
                          style={{ width: `${(entry.expenses / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 text-xs text-right">{formatBRL(entry.expenses)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Accumulated balance line */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Saldo Acumulado</p>
              <div className="flex items-end gap-1 h-12">
                {entries.map((entry) => {
                  const maxAcc = Math.max(Math.abs(Math.min(...entries.map((e) => e.accumulated))), Math.max(...entries.map((e) => e.accumulated)), 1)
                  const pct = Math.abs(entry.accumulated) / maxAcc
                  return (
                    <div key={entry.month} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div
                        className={`w-full rounded-sm transition-all ${entry.accumulated >= 0 ? 'bg-blue-500' : 'bg-orange-400'}`}
                        style={{ height: `${pct * 40}px` }}
                        title={`${entry.monthLabel}: ${formatBRL(entry.accumulated)}`}
                      />
                      <span className="text-[9px] text-muted-foreground">{entry.monthLabel.split('/')[0]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
