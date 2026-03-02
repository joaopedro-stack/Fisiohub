import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { id } = await params
  const clinic = await prisma.clinic.findUnique({ where: { id } })
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  return NextResponse.json(clinic)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { id } = await params
  const body = await req.json()
  
  const clinic = await prisma.clinic.update({
    where: { id },
    data: body,
  })
  
  return NextResponse.json(clinic)
}
