import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClinic } from '@/lib/provision-tenant'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { slugify } from '@/lib/utils'

const schema = z.object({
  clinicName: z.string().min(2, 'Nome da clínica muito curto'),
  adminName: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  plan: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']).default('BASIC'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { clinicName, adminName, email, password, plan } = parsed.data

    // Generate unique slug
    let slug = slugify(clinicName)
    const existing = await prisma.clinic.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Check email uniqueness in public Clinic table
    const emailUsed = await prisma.clinic.findUnique({ where: { email } })
    if (emailUsed) {
      return NextResponse.json({ error: { email: ['E-mail já cadastrado'] } }, { status: 409 })
    }

    // Check if email already exists in the tenant schema of any existing clinic with this slug
    const tenantCheck = getTenantPrisma(slug)
    try {
      const existingUser = await tenantCheck.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json({ error: { email: ['E-mail já cadastrado'] } }, { status: 409 })
      }
    } catch {
      // tenant schema doesn't exist yet — that's fine
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    let clinic
    try {
      clinic = await createClinic({
        name: clinicName,
        slug,
        email,
        plan,
        adminName,
        adminEmail: email,
        adminPassword: password,
      })
    } catch (err: unknown) {
      // If user creation failed due to duplicate email, surface a clear error
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Unique constraint') && msg.includes('email')) {
        return NextResponse.json({ error: { email: ['E-mail já cadastrado'] } }, { status: 409 })
      }
      throw err
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { subscriptionStatus: 'trialing', trialEndsAt },
    })

    return NextResponse.json({ slug, clinicName }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno ao criar conta. Tente novamente.' }, { status: 500 })
  }
}
