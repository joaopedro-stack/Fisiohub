import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTenantPrisma } from '@/lib/tenant-prisma'

interface ApiPingResult {
  name: string
  endpoint: string
  status: 'ok' | 'error' | 'auth_required'
  latency: number
  httpStatus?: number
  error?: string
}

async function pingApi(name: string, endpoint: string, baseUrl: string): Promise<ApiPingResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - start
    // 401/403 means the endpoint is reachable but requires auth — that's expected and OK
    if (res.ok || res.status === 401 || res.status === 403) {
      return { name, endpoint, status: res.ok ? 'ok' : 'auth_required', latency, httpStatus: res.status }
    }
    return { name, endpoint, status: 'error', latency, httpStatus: res.status, error: `HTTP ${res.status}` }
  } catch (err) {
    return {
      name,
      endpoint,
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Timeout ou erro de rede',
    }
  }
}

const API_ENDPOINTS = [
  { name: 'Auth (NextAuth)', endpoint: '/api/auth/session' },
  { name: 'Clínicas (Admin)', endpoint: '/api/admin/clinics' },
  { name: 'Dashboard', endpoint: '/api/dashboard' },
  { name: 'Pacientes', endpoint: '/api/patients' },
  { name: 'Agendamentos', endpoint: '/api/appointments' },
  { name: 'Sessões', endpoint: '/api/sessions' },
  { name: 'Fisioterapeutas', endpoint: '/api/physiotherapists' },
  { name: 'Relatórios', endpoint: '/api/reports' },
  { name: 'Salas', endpoint: '/api/rooms' },
  { name: 'Configurações', endpoint: '/api/settings' },
  { name: 'Faturas', endpoint: '/api/invoices' },
  { name: 'Despesas', endpoint: '/api/expenses' },
  { name: 'Fluxo de Caixa', endpoint: '/api/finance/cashflow' },
  { name: 'DRE', endpoint: '/api/finance/dre' },
]

export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = new URL(request.url).origin

  const clinics = await prisma.clinic.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, isActive: true, plan: true },
  })

  const [clinicResults, apiResults] = await Promise.all([
    Promise.all(
      clinics.map(async (clinic) => {
        const start = Date.now()
        try {
          const tenantPrisma = getTenantPrisma(clinic.slug)
          const userCount = await tenantPrisma.user.count()
          return {
            ...clinic,
            status: 'ok' as const,
            latency: Date.now() - start,
            userCount,
          }
        } catch (err) {
          return {
            ...clinic,
            status: 'error' as const,
            latency: Date.now() - start,
            userCount: 0,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          }
        }
      })
    ),
    Promise.all(
      API_ENDPOINTS.map(({ name, endpoint }) => pingApi(name, endpoint, baseUrl))
    ),
  ])

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    clinics: clinicResults,
    apis: apiResults,
  })
}
