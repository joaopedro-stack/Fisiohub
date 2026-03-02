import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const prisma = getTenantPrisma(slug)
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
  })
  
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const body = await req.json()
  const prisma = getTenantPrisma(slug)
  
  // Don't allow password update via PATCH without special handling
  const { password: _password, ...safeData } = body
  
  const user = await prisma.user.update({
    where: { id },
    data: { ...safeData, updatedAt: new Date() },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
  })
  
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const prisma = getTenantPrisma(slug)
  
  await prisma.user.update({
    where: { id },
    data: { isActive: false, updatedAt: new Date() },
  })
  
  return NextResponse.json({ success: true })
}
