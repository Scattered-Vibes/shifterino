'use client'

import { UserNav } from './user-nav'

interface HeaderProps {
  user: {
    email: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">911 Dispatch Scheduler</h1>
        </div>
        <UserNav user={user} />
      </div>
    </header>
  )
}
