'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Overview',
    href: '/overview',
  },
  {
    title: 'Schedules',
    href: '/schedules',
  },
  {
    title: 'Time Off',
    href: '/time-off',
  },
  {
    title: 'Shift Options',
    href: '/shift-options',
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      <Link
        href="/overview"
        className="hidden items-center space-x-2 md:flex"
      >
        <span className="hidden font-bold sm:inline-block">
          Shifterino
        </span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 