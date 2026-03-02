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
  clinicSlug: z.string().optional(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        clinicSlug: { label: 'Clinic Slug', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, clinicSlug } = parsed.data

        // Super admin login (no clinic slug or app slug)
        if (!clinicSlug || clinicSlug === 'app' || clinicSlug === 'localhost') {
          const superAdmin = await prisma.superAdmin.findUnique({
            where: { email },
          })
          if (!superAdmin) return null

          const passwordMatch = await bcrypt.compare(password, superAdmin.password)
          if (!passwordMatch) return null

          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'SUPER_ADMIN',
            clinicSlug: 'app',
          }
        }

        // Check clinic exists and is active
        const clinic = await prisma.clinic.findUnique({
          where: { slug: clinicSlug, isActive: true },
        })
        if (!clinic) return null

        // Tenant user login
        const tenantPrisma = getTenantPrisma(clinicSlug)
        const user = await tenantPrisma.user.findUnique({
          where: { email, isActive: true },
        })
        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clinicSlug,
        }
      },
    }),
  ],
})
