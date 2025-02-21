'use client'

import { cn } from '@/lib/utils'
import { NavItem } from '@/types/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavProps {
  items: NavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 hover:text-accent-foreground',
              'group'
            )}
          >
            {Icon && (
              <Icon className={cn(
                'mr-2 h-4 w-4',
                pathname === item.href
                  ? 'text-accent-foreground'
                  : 'text-muted-foreground group-hover:text-accent-foreground'
              )} />
            )}
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}