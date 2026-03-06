'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { NavItems } from './nav-items'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  clinicName?: string
  clinicLogo?: string
  isAdmin?: boolean
  userRole?: string
}

export function Sidebar({ clinicName, clinicLogo, isAdmin = false, userRole }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-full">

      {/* Clinic branding — top */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        {clinicLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinicLogo}
            alt={clinicName ?? 'Logo'}
            className="w-12 h-12 rounded-xl object-contain bg-muted border shrink-0"
          />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shrink-0">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
        {clinicName && (
          <span className="text-sm font-semibold leading-snug line-clamp-2 min-w-0">
            {clinicName}
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <NavItems isAdmin={isAdmin} userRole={userRole} />
      </ScrollArea>

      {/* FisioHub branding — bottom */}
      <div className="px-4 py-3 border-t">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary shrink-0 transition-transform group-hover:scale-105">
            <Activity className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold leading-none">FisioHub</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Gestão de Fisioterapia</span>
          </div>
        </Link>
      </div>

    </aside>
  )
}
