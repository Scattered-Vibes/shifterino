'use client'

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/ui/user-nav"
import Link from 'next/link'

interface NavigationBarProps {
  className?: string;
}

export function NavigationBar({ className }: NavigationBarProps) {
  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Shifterino</span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
} 