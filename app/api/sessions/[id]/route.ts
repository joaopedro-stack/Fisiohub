import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const prisma = getTenantPrisma(slug)
  
  const clinicalSession = await prisma.session.findUnique({
    where: { id },
    include: {
      patient: true,
      physiotherapist: { select: { id: true, name: true, email: true, role: true } },
      appointment: true,
    },
  })
  
  if (!clinicalSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(clinicalSession)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const slug = await getTenantSlug()
  if (!slug) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  
  const { id } = await params
  const body = await req.json()
  const prisma = getTenantPrisma(slug)
  
  const clinicalSession = await prisma.session.update({
    where: { id },
    data: {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      updatedAt: new Date(),
    },
  })
  
  return NextResponse.json(clinicalSession)
}
