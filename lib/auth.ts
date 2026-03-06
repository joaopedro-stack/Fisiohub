import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { authConfig } from '@/lib/auth-edge'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        // 1. Try super admin
        const superAdmin = await prisma.superAdmin.findUnique({ where: { email } })
        if (superAdmin) {
          const match = await bcrypt.compare(password, superAdmin.password)
          if (!match) return null
          return { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name, role: 'SUPER_ADMIN', clinicSlug: 'app' }
        }

        // 2. Find which clinic this email belongs to by scanning all active clinics
        const clinics = await prisma.clinic.findMany({
          where: { isActive: true },
          select: { slug: true },
        })

        for (const clinic of clinics) {
          const tenantPrisma = getTenantPrisma(clinic.slug)
          let user
          try {
            user = await tenantPrisma.user.findUnique({ where: { email, isActive: true } })
          } catch {
            continue
          }
          if (!user) continue

          const match = await bcrypt.compare(password, user.password)
          if (!match) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clinicSlug: clinic.slug,
          }
        }

        return null
      },
    }),
  ],
})
