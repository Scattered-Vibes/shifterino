'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { Button } from './button'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  role?: 'supervisor' | 'manager' | 'dispatcher'
}

// Main navigation items
const mainNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/overview',
    icon: Home,
  },
  {
    title: 'Schedule',
    href: '/schedules',
    icon: Calendar,
  },
  {
    title: 'Time-Off',
    href: '/time-off',
    icon: Clock,
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: Users,
  },
  {
    title: 'Manage',
    href: '/manage',
    icon: Home,
    role: 'supervisor', // Only visible to supervisors and managers
  },
]

// Settings navigation items
const settingsNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: Home,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Home,
  },
]

interface SideNavProps {
  role?: string
}

export function SideNav({ role = 'dispatcher' }: SideNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter items based on role
  const filteredMainItems = mainNavItems.filter((item) => {
    if (!item.role) return true
    if (item.role === 'supervisor') {
      return role === 'supervisor' || role === 'manager'
    }
    return item.role === role
  })

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href

    return (
      <Tooltip key={item.href} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-accent text-accent-foreground' : 'transparent',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <item.icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="flex items-center gap-4">
            {item.title}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  return (
    <nav className="relative space-y-4 py-4">
      <div className="absolute -right-4 top-2">
        <Button
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isCollapsed ? 'Expand' : 'Collapse'} Sidebar
          </span>
        </Button>
      </div>

      <div className="grid gap-2">
        {filteredMainItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      <div className="border-t pt-4">
        {settingsNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  )
}
