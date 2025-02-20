'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'
import type { UserRole } from '@/lib/auth/core'

interface MainNavProps {
  userRole?: UserRole
}

export function MainNav({ userRole }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="px-1 py-6">
            <SidebarNav userRole={userRole} className="px-2" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Logo */}
      <Link
        href="/overview"
        className="hidden items-center space-x-2 lg:flex"
      >
        <span className="hidden font-bold sm:inline-block">
          911 Dispatch
        </span>
      </Link>
    </div>
  )
} 