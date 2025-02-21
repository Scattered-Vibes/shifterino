'use client'

import { BaseLayout } from '@/components/layouts/BaseLayout'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ReactNode, useMemo } from 'react'
import { NavItem } from '@/types/navigation'
import { 
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Settings,
  ClipboardList,
  ArrowLeftRight,
  UserCog
} from 'lucide-react'
import { useAuth } from '@/app/providers/auth-provider'

const sidebarNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Schedules',
    href: '/schedules',
    icon: Calendar,
  },
  {
    title: 'Time Off',
    href: '/time-off',
    icon: Clock,
  },
  {
    title: 'Manage',
    href: '/manage',
    icon: ClipboardList,
    roles: ['manager', 'supervisor', 'admin'],
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: Users,
    roles: ['manager', 'supervisor', 'admin'],
  },
  {
    title: 'Shift Options',
    href: '/shift-options',
    icon: Clock,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Requirements',
    href: '/requirements',
    icon: ArrowLeftRight,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: UserCog,
  },
]

export interface DashboardClientLayoutProps {
  children: ReactNode
}

export function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role || 'dispatcher'

  const filteredNavItems = useMemo(() => 
    sidebarNavItems.filter(item => 
      !item.roles || item.roles.includes(userRole)
    ),
    [userRole]
  )

  return (
    <BaseLayout>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-r border-border bg-card md:w-64">
          <div className="sticky top-16 overflow-y-auto p-4">
            <SidebarNav items={filteredNavItems} />
          </div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </BaseLayout>
  )
} 