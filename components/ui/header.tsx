'use client'

import { MainNav } from './main-nav'
import { UserNav } from '@/components/ui/user-nav'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  user: {
    email: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav user={user} />
        </div>
      </div>
    </div>
  )
}
