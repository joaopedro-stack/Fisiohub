import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const DEFAULT_SETTINGS = {
  id: 'default',
  sessionDuration: 60,
  openingTime: '08:00',
  closingTime: '18:00',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const updateSettingsSchema = z.object({
  sessionDuration: z.number().int().min(15).max(480).optional(),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  try {
    const prisma = getTenantPrisma(slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any
    if (typeof client.clinicSettings === 'undefined') {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    let settings = await client.clinicSettings.findFirst()
    if (!settings) {
      settings = DEFAULT_SETTINGS
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const body = await req.json()
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const prisma = getTenantPrisma(slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any
    if (typeof client.clinicSettings === 'undefined') {
      return NextResponse.json(
        { error: 'Execute npm run prisma:migrate para habilitar configurações persistentes.' },
        { status: 503 }
      )
    }

    const settings = await client.clinicSettings.upsert({
      where: { id: `settings_${slug}` },
      update: { ...parsed.data, updatedAt: new Date() },
      create: {
        id: `settings_${slug}`,
        ...parsed.data,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(
      { error: 'Tabela não encontrada. Execute as migrações do banco de dados.' },
      { status: 503 }
    )
  }
}
