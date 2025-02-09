'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Settings,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

const routes = [
  {
    label: 'Overview',
    icon: Home,
    href: '/overview',
    color: 'text-sky-500',
  },
  {
    label: 'Manage',
    icon: Settings,
    href: '/manage',
    color: 'text-pink-700',
  },
  {
    label: 'Schedules',
    icon: Calendar,
    href: '/schedules',
    color: 'text-violet-500',
  },
  {
    label: 'Time Off',
    icon: Clock,
    href: '/time-off',
    color: 'text-pink-700',
  },
  {
    label: 'Employees',
    icon: Users,
    href: '/employees',
    color: 'text-orange-700',
    role: 'manager',
  },
  {
    label: 'Shift Options',
    icon: CalendarClock,
    href: '/shift-options',
    color: 'text-blue-700',
  },
  {
    label: 'Requirements',
    icon: CheckCircle,
    href: '/requirements',
    color: 'text-green-700',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500',
    role: 'manager',
  },
]

interface SidebarNavProps {
  className?: string
  userRole?: string
}

export function SidebarNav({ className, userRole }: SidebarNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredRoutes = routes.filter(
    (route) => !route.role || route.role === userRole
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        <div className="absolute -right-3 top-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 rounded-full"
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

        <nav className="flex flex-col gap-2 p-4">
          {filteredRoutes.map((route) => {
            const isActive = pathname === route.href

            return (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'justify-start',
                      isActive && 'bg-muted',
                      isCollapsed && 'justify-center px-2'
                    )}
                    asChild
                  >
                    <Link href={route.href}>
                      <route.icon className={cn('h-5 w-5', route.color)} />
                      {!isCollapsed && (
                        <span className="ml-2">{route.label}</span>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {route.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>
      </div>
    </TooltipProvider>
  )
} 