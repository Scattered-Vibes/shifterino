'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface NavProps {
  items: NavItem[]
}

export function Nav({ items }: NavProps) {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent" : "transparent",
              isActive ? "text-accent-foreground" : "text-muted-foreground"
            )}
          >
            {item.icon && (
              <item.icon className="mr-2 h-4 w-4" />
            )}
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export const dashboardNavItems = [
  {
    title: "Overview",
    href: "/overview",
  },
  {
    title: "My Schedule",
    href: "/schedules",
  },
  {
    title: "Time Off",
    href: "/time-off",
  },
  {
    title: "Employees",
    href: "/employees",
  },
  {
    title: "Schedule Management",
    href: "/manage",
  },
  {
    title: "Profile",
    href: "/profile",
  },
] 