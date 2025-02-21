'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/ui/user-nav"

const navItems = [
  { href: '/overview', label: 'Overview' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/manage', label: 'Manage' },
  { href: '/profile', label: 'Profile' },
]

interface NavigationBarProps {
  className?: string;
}

export function NavigationBar({ className }: NavigationBarProps) {
  const pathname = usePathname()

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Shifterino</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other controls here */}
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  )
} 