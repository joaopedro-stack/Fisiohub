import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

// Edge-compatible auth config (no Prisma, no bcrypt)
// Used by middleware to validate JWT tokens without DB access
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.clinicSlug = (user as { clinicSlug: string }).clinicSlug
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as import('@/types').UserRole
        session.user.clinicSlug = token.clinicSlug as string
      }
      return session
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
}

export const { auth } = NextAuth(authConfig)
