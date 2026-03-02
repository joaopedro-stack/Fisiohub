import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/**
 * Gets the tenant slug from x-tenant-slug header (set by middleware when on subdomain)
 * or falls back to the session's clinicSlug (when on localhost without subdomain).
 */
export async function getTenantSlug(): Promise<string | null> {
  const headersList = await headers()
  const headerSlug = headersList.get('x-tenant-slug')

  // If header is present and is a real clinic slug (not 'app'), use it
  if (headerSlug && headerSlug !== 'app') {
    return headerSlug
  }

  // Fallback: use slug from JWT session
  const session = await auth()
  const sessionSlug = session?.user?.clinicSlug
  if (sessionSlug && sessionSlug !== 'app') {
    return sessionSlug
  }

  return null
}
