import { PrismaClient } from '@/generated/tenant'

type TenantPrismaClient = PrismaClient

const tenantClients = new Map<string, TenantPrismaClient>()

export function getTenantPrisma(slug: string): TenantPrismaClient {
  if (tenantClients.has(slug)) {
    return tenantClients.get(slug)!
  }

  const baseUrl = process.env.DATABASE_URL!
  const url = new URL(baseUrl)
  url.searchParams.set('schema', `clinic_${slug}`)

  const client = new PrismaClient({
    datasourceUrl: url.toString(),
  })

  // Cache in development, create fresh in production for safety
  if (process.env.NODE_ENV === 'development') {
    tenantClients.set(slug, client)
  }

  return client
}

export async function disconnectTenantPrisma(slug: string): Promise<void> {
  const client = tenantClients.get(slug)
  if (client) {
    await client.$disconnect()
    tenantClients.delete(slug)
  }
}
