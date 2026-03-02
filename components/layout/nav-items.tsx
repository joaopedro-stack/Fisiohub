'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  Building2,
  Settings,
  BarChart2,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const clinicNavItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pacientes', href: '/patients', icon: Users },
  { label: 'Fisioterapeutas', href: '/physiotherapists', icon: UserCog },
  { label: 'Agendamentos', href: '/appointments', icon: Calendar },
  { label: 'Sessões', href: '/sessions', icon: ClipboardList },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart2, adminOnly: true },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet, adminOnly: true },
  { label: 'Configurações', href: '/settings', icon: Settings },
]

const adminNavItems = [
  { label: 'Clínicas', href: '/admin', icon: Building2 },
]

interface NavItemsProps {
  isAdmin?: boolean
  userRole?: string
}

export function NavItems({ isAdmin = false, userRole }: NavItemsProps) {
  const pathname = usePathname()
  const baseItems = isAdmin ? adminNavItems : clinicNavItems
  const items = userRole === 'PHYSIOTHERAPIST'
    ? baseItems.filter((item) => item.href !== '/physiotherapists' && !('adminOnly' in item && item.adminOnly))
    : baseItems

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
