'use client'

import { useSession } from 'next-auth/react'

export function useTenant() {
  const { data: session } = useSession()
  return session?.user?.clinicSlug ?? null
}

export function useCurrentUser() {
  const { data: session, status } = useSession()
  return { user: session?.user, status }
}
