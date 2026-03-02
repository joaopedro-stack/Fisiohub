import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar clinicName="Super Admin" isAdmin />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userName={session.user.name} userRole={session.user.role} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
