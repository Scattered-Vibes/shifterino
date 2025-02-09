'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const routes = [
  {
    label: 'Overview',
    href: '/overview',
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold">911 Dispatch Scheduler</span>
      </Link>
      <div className="flex gap-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === route.href
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </nav>
  )
} 