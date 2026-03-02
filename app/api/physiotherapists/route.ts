import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PHYSIOTHERAPIST', 'RECEPTIONIST']).default('PHYSIOTHERAPIST'),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const prisma = getTenantPrisma(slug)
  
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { name: 'asc' },
  })
  
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  
  const prisma = getTenantPrisma(slug)
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => Math.random().toString(36).slice(2) }))
  
  const user = await prisma.user.create({
    data: {
      ...parsed.data,
      id: createId(),
      password: hashedPassword,
      updatedAt: new Date(),
    },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
  })
  
  return NextResponse.json(user, { status: 201 })
}
