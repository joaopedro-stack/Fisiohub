import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function getMainUrl() {
  return process.env.NODE_ENV === 'production'
    ? 'https://fisiohub.com.br'
    : 'http://localhost:3000'
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')

  if (slug && slug !== 'app') {
    const clinic = await prisma.clinic.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    })
    if (!clinic) {
      redirect(getMainUrl())
    }
  }

  return <>{children}</>
}
