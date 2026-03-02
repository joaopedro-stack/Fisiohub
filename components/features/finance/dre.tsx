'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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

interface DREData {
  year: number
  grossRevenue: number
  deductions: { refunds: number; insurancePending: number; total: number }
  netRevenue: number
  expenses: { byCategory: Record<string, number>; total: number }
  profit: number
  profitMargin: string
}

interface Props {
  year: number
}

function DRERow({ label, value, indent = false, bold = false, highlight }: {
  label: string
  value: number
  indent?: boolean
  bold?: boolean
  highlight?: 'green' | 'red' | 'blue'
}) {
  const colorMap = {
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
  }
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''} ${highlight ? colorMap[highlight] : ''}`}>
        {formatBRL(value)}
      </span>
    </div>
  )
}

export function DRE({ year }: Props) {
  const { data, isLoading } = useQuery<DREData>({
    queryKey: ['finance-dre', year],
    queryFn: () => fetch(`/api/finance/dre?year=${year}`).then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const sortedCategories = Object.entries(data.expenses.byCategory)
    .sort(([, a], [, b]) => b - a)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DRE Simplificada — {year}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Revenue */}
        <DRERow label="(+) Receita Bruta" value={data.grossRevenue} bold highlight="green" />
        <DRERow label="(-) Devoluções / Estornos" value={data.deductions.refunds} indent />
        <DRERow label="(-) Convênio pendente (glosa/parcial)" value={data.deductions.insurancePending} indent />
        <Separator className="my-2" />
        <DRERow label="(=) Receita Líquida" value={data.netRevenue} bold />

        {/* Expenses */}
        <div className="pt-2">
          <p className="text-sm font-semibold mb-1">(-) Despesas Operacionais</p>
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-4">Nenhuma despesa paga no período</p>
          ) : (
            sortedCategories.map(([cat, amount]) => (
              <DRERow key={cat} label={CATEGORY_LABELS[cat] ?? cat} value={amount} indent />
            ))
          )}
          <DRERow label="Total de Despesas" value={data.expenses.total} bold highlight="red" />
        </div>

        <Separator className="my-2" />

        {/* Profit */}
        <DRERow
          label="(=) Resultado Líquido"
          value={data.profit}
          bold
          highlight={data.profit >= 0 ? 'green' : 'red'}
        />
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Margem de Lucro</span>
          <span className={`text-sm font-semibold ${data.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {data.profitMargin}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
