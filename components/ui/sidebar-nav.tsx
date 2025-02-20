'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/index'
import { buttonVariants } from '@/components/ui/button'
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  Settings2Icon,
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
  ClipboardListIcon,
  UserCogIcon
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/core'

interface NavItem {
  href: string
  title: string
  icon: React.ReactNode
  requiredRole?: UserRole
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: NavItem[]
  userRole?: UserRole
}

const defaultItems: NavItem[] = [
  {
    href: '/overview',
    title: 'Overview',
    icon: <LayoutDashboardIcon className="mr-2 h-4 w-4" />
  },
  {
    href: '/schedules',
    title: 'Schedules',
    icon: <CalendarIcon className="mr-2 h-4 w-4" />
  },
  {
    href: '/time-off',
    title: 'Time Off',
    icon: <ClockIcon className="mr-2 h-4 w-4" />
  },
  {
    href: '/manage',
    title: 'Manage',
    icon: <ClipboardListIcon className="mr-2 h-4 w-4" />,
    requiredRole: 'supervisor'
  },
  {
    href: '/employees',
    title: 'Employees',
    icon: <UsersIcon className="mr-2 h-4 w-4" />,
    requiredRole: 'supervisor'
  },
  {
    href: '/shift-options',
    title: 'Shift Options',
    icon: <ClockIcon className="mr-2 h-4 w-4" />,
    requiredRole: 'manager'
  },
  {
    href: '/requirements',
    title: 'Requirements',
    icon: <ArrowLeftRightIcon className="mr-2 h-4 w-4" />,
    requiredRole: 'manager'
  },
  {
    href: '/settings',
    title: 'Settings',
    icon: <UserCogIcon className="mr-2 h-4 w-4" />
  }
]

function hasRequiredRole(userRole: UserRole | undefined, requiredRole?: UserRole): boolean {
  if (!requiredRole) return true
  if (!userRole) return false
  
  switch (requiredRole) {
    case 'supervisor':
      return userRole === 'supervisor' || userRole === 'manager'
    case 'manager':
      return userRole === 'manager'
    default:
      return true
  }
}

export function SidebarNav({ className, items, userRole, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const navItems = items || defaultItems
  const filteredItems = navItems.filter(item => hasRequiredRole(userRole, item.requiredRole))

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className
      )}
      {...props}
    >
      {filteredItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start w-full'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 