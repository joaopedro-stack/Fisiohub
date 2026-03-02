import 'next-auth'
import type { UserRole } from './index'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      clinicSlug: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    clinicSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    clinicSlug: string
  }
}
