'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, CheckCircle2, XCircle, Clock, Database, Users, Wifi, Globe, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  PROFESSIONAL: 'Profissional',
  ENTERPRISE: 'Enterprise',
}

interface ClinicHealth {
  id: string
  name: string
  slug: string
  isActive: boolean
  plan: string
  status: 'ok' | 'error'
  latency: number
  userCount: number
  error?: string
}

interface ApiPingResult {
  name: string
  endpoint: string
  status: 'ok' | 'error' | 'auth_required'
  latency: number
  httpStatus?: number
  error?: string
}

interface HealthData {
  checkedAt: string
  clinics: ClinicHealth[]
  apis: ApiPingResult[]
}

async function fetchHealth(): Promise<HealthData> {
  const res = await fetch('/api/admin/health')
  if (!res.ok) throw new Error('Falha ao buscar status')
  return res.json()
}

function LatencyBadge({ ms }: { ms: number }) {
  const color =
    ms < 200 ? 'text-green-500' : ms < 500 ? 'text-yellow-500' : 'text-red-500'
  return (
    <span className={cn('font-mono text-xs font-medium', color)}>
      {ms}ms
    </span>
  )
}

function ApiStatusIcon({ status }: { status: ApiPingResult['status'] }) {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === 'auth_required') return <ShieldAlert className="h-4 w-4 text-blue-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

export default function MonitoringPage() {
  const [queryKey, setQueryKey] = useState(0)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin-health', queryKey],
    queryFn: fetchHealth,
    staleTime: 0,
  })

  const refresh = useCallback(() => setQueryKey((k) => k + 1), [])

  const clinics = data?.clinics ?? []
  const apis = data?.apis ?? []
  const healthy = clinics.filter((c) => c.status === 'ok').length
  const unhealthy = clinics.filter((c) => c.status === 'error').length
  const avgLatency = clinics.length
    ? Math.round(clinics.reduce((s, c) => s + c.latency, 0) / clinics.length)
    : 0
  const apisOk = apis.filter((a) => a.status === 'ok' || a.status === 'auth_required').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoramento</h1>
          <p className="text-muted-foreground text-sm">
            Status em tempo real de todas as clínicas, bancos de dados e APIs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {new Date(data.checkedAt).toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button onClick={refresh} disabled={isFetching} variant="outline" size="sm">
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Total de Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{clinics.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{healthy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Com Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{unhealthy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Latência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgLatency}<span className="text-sm font-normal text-muted-foreground">ms</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              APIs OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{apisOk}<span className="text-sm font-normal text-muted-foreground">/{apis.length}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Clinic health table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Saúde das Clínicas (DB)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Clínica</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Usuários
                  </span>
                </TableHead>
                <TableHead>Latência DB</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Executando testes...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500 py-8">
                    Erro ao buscar dados de monitoramento
                  </TableCell>
                </TableRow>
              ) : clinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma clínica cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                clinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      {clinic.status === 'ok' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {clinic.name}
                        {!clinic.isActive && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">inativa</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{clinic.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {PLAN_LABELS[clinic.plan] ?? clinic.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{clinic.userCount}</TableCell>
                    <TableCell>
                      <LatencyBadge ms={clinic.latency} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {clinic.error ? (
                        <span className="text-red-400">{clinic.error}</span>
                      ) : (
                        <span className="text-green-500">Schema OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API ping table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ping de APIs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Latência</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Testando APIs...
                  </TableCell>
                </TableRow>
              ) : apis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum resultado
                  </TableCell>
                </TableRow>
              ) : (
                apis.map((api) => (
                  <TableRow key={api.endpoint}>
                    <TableCell>
                      <ApiStatusIcon status={api.status} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{api.name}</p>
                        <code className="text-[11px] text-muted-foreground">{api.endpoint}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {api.httpStatus !== undefined && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-mono',
                            api.httpStatus < 300 && 'border-green-500 text-green-600',
                            api.httpStatus === 401 || api.httpStatus === 403 ? 'border-blue-500 text-blue-600' : '',
                            api.httpStatus >= 500 && 'border-red-500 text-red-600',
                          )}
                        >
                          {api.httpStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <LatencyBadge ms={api.latency} />
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {api.error ? (
                        <span className="text-red-400">{api.error}</span>
                      ) : api.status === 'auth_required' ? (
                        <span className="text-blue-500">Requer autenticação (esperado)</span>
                      ) : (
                        <span className="text-green-500">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
