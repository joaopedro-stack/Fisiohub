import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().nullable().optional(), // base64 data URL or null
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = session.user.clinicSlug
  if (!slug) return NextResponse.json({ error: 'No clinic' }, { status: 400 })

  const clinic = await prisma.clinic.findUnique({ where: { slug } })
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(clinic)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = session.user.clinicSlug
  if (!slug) return NextResponse.json({ error: 'No clinic' }, { status: 400 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Validate logo size if present (base64 ~1.37x original, so 5MB file = ~6.85MB base64)
  if (parsed.data.logo && parsed.data.logo.length > 7 * 1024 * 1024) {
    return NextResponse.json({ error: 'Logo muito grande (máx 5MB)' }, { status: 400 })
  }

  const clinic = await prisma.clinic.update({
    where: { slug },
    data: parsed.data,
  })

  return NextResponse.json(clinic)
}
