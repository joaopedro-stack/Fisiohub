import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'

const roomSchema = z.object({ name: z.string().min(1, 'Nome obrigatório').max(80) })

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  try {
    const prisma = getTenantPrisma(slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any
    if (typeof client.room === 'undefined') return NextResponse.json([])

    const rooms = await client.room.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(rooms)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const body = await req.json()
  const parsed = roomSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const prisma = getTenantPrisma(slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any
    if (typeof client.room === 'undefined') {
      return NextResponse.json({ error: 'Execute as migrações primeiro.' }, { status: 503 })
    }

    const { createId } = await import('@paralleldrive/cuid2').catch(() => ({
      createId: () => Math.random().toString(36).slice(2),
    }))

    const room = await client.room.create({
      data: { id: createId(), name: parsed.data.name, updatedAt: new Date() },
    })
    return NextResponse.json(room, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sala' }, { status: 500 })
  }
}
