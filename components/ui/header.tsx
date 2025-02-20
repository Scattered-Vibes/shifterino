'use client'

import { MainNav } from './main-nav'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
