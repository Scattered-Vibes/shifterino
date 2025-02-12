'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  Settings2Icon,
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
} from 'lucide-react'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const defaultItems = [
    {
      href: '/overview',
      title: 'Overview',
      icon: <LayoutDashboardIcon className="mr-2 h-4 w-4" />
    },
    {
      href: '/schedule',
      title: 'Schedule',
      icon: <CalendarIcon className="mr-2 h-4 w-4" />
    },
    {
      href: '/shifts',
      title: 'Shifts',
      icon: <ClockIcon className="mr-2 h-4 w-4" />
    },
    {
      href: '/swap-requests',
      title: 'Swap Requests',
      icon: <ArrowLeftRightIcon className="mr-2 h-4 w-4" />
    },
    {
      href: '/employees',
      title: 'Employees',
      icon: <UsersIcon className="mr-2 h-4 w-4" />
    },
    {
      href: '/settings',
      title: 'Settings',
      icon: <Settings2Icon className="mr-2 h-4 w-4" />
    },
  ]

  const navItems = items || defaultItems

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className
      )}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 