'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CashFlow } from '@/components/features/finance/cash-flow'
import { DRE } from '@/components/features/finance/dre'
import { InvoicesList } from '@/components/features/finance/invoices-list'
import { ExpensesList } from '@/components/features/finance/expenses-list'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const PERIOD_OPTIONS = [
  { label: 'Últimos 3 meses', value: '3' },
  { label: 'Últimos 6 meses', value: '6' },
  { label: 'Últimos 12 meses', value: '12' },
]

function getPeriodDates(months: number) {
  const now = new Date()
  const from = startOfMonth(subMonths(now, months - 1))
  const to = endOfMonth(now)
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }
}

export default function FinanceiroPage() {
  const [periodMonths, setPeriodMonths] = useState('6')
  const [dreYear, setDreYear] = useState(String(new Date().getFullYear()))

  const { from, to } = getPeriodDates(parseInt(periodMonths, 10))
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Fluxo de caixa, DRE, cobranças e despesas da clínica.</p>
      </div>

      <Tabs defaultValue="cashflow">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="invoices">Cobranças</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
        </TabsList>

        {/* Cash Flow */}
        <TabsContent value="cashflow" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Período:</span>
            <Select value={periodMonths} onValueChange={setPeriodMonths}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CashFlow from={from} to={to} />
        </TabsContent>

        {/* DRE */}
        <TabsContent value="dre" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Ano:</span>
            <Select value={dreYear} onValueChange={setDreYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DRE year={parseInt(dreYear, 10)} />
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-6">
          <InvoicesList />
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-6">
          <ExpensesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
