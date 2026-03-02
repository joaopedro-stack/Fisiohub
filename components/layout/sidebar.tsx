'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { NavItems } from './nav-items'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  clinicName?: string
  isAdmin?: boolean
  userRole?: string
}

export function Sidebar({ clinicName, isAdmin = false, userRole }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-full">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Activity className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold">FisioHub</span>
          {clinicName && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {clinicName}
            </span>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <NavItems isAdmin={isAdmin} userRole={userRole} />
      </ScrollArea>
    </aside>
  )
}
