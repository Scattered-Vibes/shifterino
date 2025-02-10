'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CalendarIcon,
  PersonIcon,
  ClockIcon,
  GearIcon,
  BarChartIcon,
} from '@radix-ui/react-icons'

interface SidebarNavProps {
  userRole: string
}

const routes = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: BarChartIcon,
  },
  {
    href: '/schedule',
    label: 'Schedule',
    icon: CalendarIcon,
  },
  {
    href: '/employees',
    label: 'Employees',
    icon: PersonIcon,
    adminOnly: true,
  },
  {
    href: '/time-off',
    label: 'Time Off',
    icon: ClockIcon,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: GearIcon,
    adminOnly: true,
  },
]

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'SUPERVISOR' || userRole === 'MANAGER'

  return (
    <nav className="grid items-start gap-2">
      {routes.map((route) => {
        if (route.adminOnly && !isAdmin) return null

        const Icon = route.icon
        const isActive = pathname === route.href

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-accent text-accent-foreground' : 'transparent'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{route.label}</span>
          </Link>
        )
      })}
    </nav>
  )
} 