import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const MAIN_URL = process.env.NODE_ENV === 'production'
  ? 'https://fisiohub.com.br'
  : 'http://localhost:3000'

export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug') ?? session.user.clinicSlug

  const clinic = await prisma.clinic.findUnique({ where: { slug } })
  if (!clinic || !clinic.isActive) {
    redirect(MAIN_URL)
  }
  const clinicName = clinic.name

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar clinicName={clinicName} userRole={session.user.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userName={session.user.name} userRole={session.user.role} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
