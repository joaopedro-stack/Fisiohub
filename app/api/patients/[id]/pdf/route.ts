import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { prisma as publicPrisma } from '@/lib/prisma'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import { PatientPDF } from '@/components/features/patients/patient-pdf'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const { id } = await params
  const prisma = getTenantPrisma(slug)

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { physiotherapist: { select: { name: true } } },
        orderBy: { startTime: 'desc' },
        take: 20,
      },
      sessions: {
        include: { physiotherapist: { select: { name: true } } },
        orderBy: { startTime: 'desc' },
        take: 20,
      },
      anamnesis: true,
    },
  })

  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const clinic = await publicPrisma.clinic.findUnique({ where: { slug } })
  const clinicName = clinic?.name ?? slug

  const safeFileName = patient.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()

  const element = createElement(PatientPDF, { patient, clinicName }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prontuario-${safeFileName}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
