'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  User,
  Cog,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

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
    icon: LayoutDashboard,
  },
  {
    title: 'Schedule',
    href: '/schedule',
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
    icon: ShieldCheck,
    role: 'supervisor', // Only visible to supervisors and managers
  },
]

// Settings navigation items
const settingsNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Cog,
  },
]

interface SideNavProps {
  role?: string
}

export function SideNav({ role = 'dispatcher' }: SideNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter items based on role
  const filteredMainItems = mainNavItems.filter(item => {
    if (!item.role) return true
    if (item.role === 'supervisor') {
      return role === 'supervisor' || role === 'manager'
    }
    return item.role === role
  })

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href
    
    return (
      <Tooltip delayDuration={0}>
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