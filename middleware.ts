import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth-edge'

function extractSlug(host: string): string | null {
  const hostname = host.split(':')[0]

  if (
    hostname === 'localhost' ||
    hostname === 'fisiohub.com.br' ||
    hostname === 'www.fisiohub.com.br'
  ) {
    return null
  }

  const parts = hostname.split('.')

  // app.fisiohub.com.br or app.localhost → super admin
  if (parts[0] === 'app') {
    return 'app'
  }

  // Any subdomain
  if (parts.length >= 2) {
    return parts[0]
  }

  return null
}

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') ?? ''
  const slug = extractSlug(host)

  const requestHeaders = new Headers(req.headers)
  if (slug) {
    requestHeaders.set('x-tenant-slug', slug)
  }

  const session = req.auth

  // Public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/agendar') ||
    pathname.startsWith('/agendamento/resposta') ||
    pathname.startsWith('/api/appointments/respond') ||
    pathname.startsWith('/api/booking') ||
    pathname === '/'
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Protect clinic routes
  const isClinicRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/patients') ||
    pathname.startsWith('/physiotherapists') ||
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/sessions') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/relatorios')

  if (isClinicRoute) {
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (
      slug &&
      slug !== 'app' &&
      session.user.clinicSlug !== slug &&
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Physiotherapists cannot access the team management page
    if (
      pathname.startsWith('/physiotherapists') &&
      session.user.role === 'PHYSIOTHERAPIST'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
