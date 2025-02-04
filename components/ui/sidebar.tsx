'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  HomeIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Schedules', href: '/schedules', icon: CalendarIcon },
  { name: 'Time Off', href: '/time-off', icon: ClockIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Manage', href: '/manage', icon: UsersIcon, requiresManager: true },
]

interface SidebarProps {
  userRole?: 'dispatcher' | 'supervisor' | 'manager'
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => 
    !item.requiresManager || userRole === 'manager'
  )

  return (
    <div className="w-64 bg-white border-r">
      <div className="flex flex-col h-full">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    isActive
                      ? 'text-gray-500'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
} 