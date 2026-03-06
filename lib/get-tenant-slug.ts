import { auth } from '@/lib/auth'

/**
 * Gets the tenant slug from the JWT session.
 */
export async function getTenantSlug(): Promise<string | null> {
  const session = await auth()
  const sessionSlug = session?.user?.clinicSlug
  if (sessionSlug && sessionSlug !== 'app') {
    return sessionSlug
  }
  return null
}
