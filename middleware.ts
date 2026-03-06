import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth-edge'

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public paths — always accessible
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/agendar') ||
    pathname.startsWith('/agendamento/resposta') ||
    pathname.startsWith('/api/appointments/respond') ||
    pathname.startsWith('/api/booking') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/api/register') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/planos') ||
    pathname === '/'
  ) {
    return NextResponse.next()
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
    pathname.startsWith('/relatorios') ||
    pathname.startsWith('/financeiro')

  if (isClinicRoute) {
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname + (req.nextUrl.search ?? ''))
      return NextResponse.redirect(loginUrl)
    }

    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (pathname.startsWith('/physiotherapists') && session.user.role === 'PHYSIOTHERAPIST') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
