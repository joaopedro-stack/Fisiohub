'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, DollarSign, Calendar, Users, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthlyStat {
  month: string
  monthFull: string
  total: number
  scheduled: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  revenue: number
}

interface ReportData {
  monthlyStats: MonthlyStat[]
  statusDistribution: Record<string, number>
  topPhysiotherapists: { name: string; count: number; completed: number }[]
  revenueTotal: number
  pendingRevenue: number
  activePatientsCount: number
  physioCount: number
  totalInPeriod: number
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-violet-500',
  CONFIRMED:   'bg-blue-500',
  COMPLETED:   'bg-emerald-500',
  NO_SHOW:     'bg-orange-400',
  CANCELLED:   'bg-red-400',
  IN_PROGRESS: 'bg-amber-500',
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function exportToCSV(data: ReportData) {
  const sep = ';'
  const rows: string[] = []

  rows.push('RESUMO MENSAL')
  rows.push(['Mês', 'Total', 'Agendados', 'Confirmados', 'Concluídos', 'Não Compareceu', 'Cancelados', 'Receita (R$)'].join(sep))
  for (const s of data.monthlyStats) {
    rows.push([s.monthFull, s.total, s.scheduled, s.confirmed, s.completed, s.noShow, s.cancelled, s.revenue.toFixed(2)].join(sep))
  }

  rows.push('')
  rows.push('TOP FISIOTERAPEUTAS')
  rows.push(['Nome', 'Agendamentos', 'Concluídos', 'Taxa de Conclusão (%)'].join(sep))
  for (const p of data.topPhysiotherapists) {
    const rate = p.count > 0 ? Math.round((p.completed / p.count) * 100) : 0
    rows.push([p.name, p.count, p.completed, rate].join(sep))
  }

  rows.push('')
  rows.push('DISTRIBUIÇÃO POR STATUS')
  rows.push(['Status', 'Quantidade'].join(sep))
  const statusLabels: Record<string, string> = {
    SCHEDULED: 'Agendado', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluído', CANCELLED: 'Cancelado', NO_SHOW: 'Não compareceu',
  }
  for (const [status, count] of Object.entries(data.statusDistribution)) {
    rows.push([(statusLabels[status] ?? status), count].join(sep))
  }

  const bom = '\uFEFF'
  const csv = bom + rows.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-fisiohub-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['reports'],
    queryFn: async () => {
      const year = new Date().getFullYear()
      const res = await fetch(`/api/reports?year=${year}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho da clínica</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  const maxMonthly = Math.max(...data.monthlyStats.map((m) => m.total), 1)
  const maxRevenue = Math.max(...data.monthlyStats.map((m) => m.revenue), 1)
  const totalStatus = Object.values(data.statusDistribution).reduce((s, v) => s + v, 0)
  const maxPhysio = Math.max(...data.topPhysiotherapists.map((p) => p.count), 1)

  const summaryKpis = [
    {
      label: 'Receita Recebida',
      value: formatBRL(data.revenueTotal),
      sub: `${formatBRL(data.pendingRevenue)} pendente`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: `Agendamentos (${new Date().getFullYear()})`,
      value: String(data.totalInPeriod),
      sub: `${data.monthlyStats.reduce((s, m) => s + m.completed, 0)} concluídos`,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Pacientes Ativos',
      value: String(data.activePatientsCount),
      sub: `${data.physioCount} fisioterapeutas`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Taxa de Conclusão',
      value: data.totalInPeriod > 0
        ? `${Math.round((data.monthlyStats.reduce((s, m) => s + m.completed, 0) / data.totalInPeriod) * 100)}%`
        : '—',
      sub: `${data.monthlyStats.reduce((s, m) => s + m.cancelled, 0)} cancelamentos`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho da clínica — {new Date().getFullYear()}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(data)} className="shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg', kpi.bg)}>
                  <Icon className={cn('h-4 w-4', kpi.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monthly appointment chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamentos por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyStats.map((stat) => {
              const segments = [
                { count: stat.scheduled, color: 'bg-violet-500',  title: 'Agendado' },
                { count: stat.confirmed, color: 'bg-blue-500',    title: 'Confirmado' },
                { count: stat.completed, color: 'bg-emerald-500', title: 'Concluído' },
                { count: stat.noShow,    color: 'bg-orange-400',  title: 'Não compareceu' },
                { count: stat.cancelled, color: 'bg-red-400',     title: 'Cancelado' },
              ].filter((s) => s.count > 0)

              return (
                <div key={stat.month} className="flex items-center gap-3 text-sm">
                  <span className="font-medium capitalize w-8 shrink-0">{stat.month}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex">
                    {stat.total === 0 ? null : segments.map((seg) => (
                      <div
                        key={seg.title}
                        title={`${seg.title}: ${seg.count}`}
                        className={`h-full ${seg.color} transition-all duration-500`}
                        style={{ width: `${(seg.count / maxMonthly) * 100}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold w-6 text-right shrink-0">{stat.total}</span>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t text-xs text-muted-foreground">
            {[
              { color: 'bg-violet-500',  label: 'Agendado' },
              { color: 'bg-blue-500',    label: 'Confirmado' },
              { color: 'bg-emerald-500', label: 'Concluído' },
              { color: 'bg-orange-400',  label: 'Não compareceu' },
              { color: 'bg-red-400',     label: 'Cancelado' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-3 rounded-sm ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyStats.map((stat) => (
              <div key={stat.month} className="flex items-center gap-3">
                <span className="font-medium text-sm capitalize w-16 shrink-0">{stat.month}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: stat.revenue === 0 ? '0%' : `${(stat.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-24 text-right shrink-0">
                  {stat.revenue > 0 ? formatBRL(stat.revenue) : '—'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.statusDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const pct = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={cn('h-3 w-3 rounded-full shrink-0', STATUS_COLORS[status] ?? 'bg-muted')} />
                      <span className="text-sm flex-1">{STATUS_LABELS[status] ?? status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', STATUS_COLORS[status] ?? 'bg-muted-foreground')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {count} ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Top physiotherapists */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Fisioterapeutas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPhysiotherapists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda</p>
            ) : (
              <div className="space-y-3">
                {data.topPhysiotherapists.map((physio, i) => {
                  const completionRate = physio.count > 0
                    ? Math.round((physio.completed / physio.count) * 100)
                    : 0
                  return (
                    <div key={physio.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{physio.name}</p>
                        <div className="mt-0.5 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${(physio.count / maxPhysio) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold">{physio.count}</span>
                        <p className="text-[10px] text-muted-foreground">{completionRate}% ok</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left py-2 font-medium">Mês</th>
                <th className="text-center py-2 font-medium">Total</th>
                <th className="text-center py-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
                    Agendados
                  </span>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    Confirmados
                  </span>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Concluídos
                  </span>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                    Faltas
                  </span>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    Cancelados
                  </span>
                </th>
                <th className="text-right py-2 font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyStats.map((stat) => (
                <tr key={stat.month} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 font-medium capitalize">{stat.monthFull}</td>
                  <td className="py-2.5 text-center">
                    <Badge variant="outline">{stat.total}</Badge>
                  </td>
                  <td className="py-2.5 text-center text-violet-600 font-medium">{stat.scheduled || '—'}</td>
                  <td className="py-2.5 text-center text-blue-600 font-medium">{stat.confirmed || '—'}</td>
                  <td className="py-2.5 text-center text-emerald-600 font-medium">{stat.completed || '—'}</td>
                  <td className="py-2.5 text-center text-orange-500 font-medium">{stat.noShow || '—'}</td>
                  <td className="py-2.5 text-center text-red-500 font-medium">{stat.cancelled || '—'}</td>
                  <td className="py-2.5 text-right font-medium text-emerald-600">
                    {stat.revenue > 0 ? formatBRL(stat.revenue) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
