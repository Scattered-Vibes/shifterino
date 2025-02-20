'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMediaQuery } from '@/lib/hooks/client/use-media-query'
import type { User } from '@supabase/supabase-js'
import type { Employee } from '@/types/models/employee'
import type { UserRole } from '@/lib/auth/core'

interface ClientManageLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  user: User
  employee: Employee
}

interface Tab {
  value: string
  label: string
  requiredRole?: UserRole
}

const tabs: Tab[] = [
  { value: 'schedule', label: 'Schedule' },
  {
    value: 'overtime',
    label: 'Overtime',
    requiredRole: 'supervisor'
  },
  { value: 'swaps', label: 'Shift Swaps' },
  {
    value: 'on-call',
    label: 'On-Call',
    requiredRole: 'supervisor'
  },
  {
    value: 'reports',
    label: 'Reports',
    requiredRole: 'manager'
  },
]

const hasRequiredRole = (userRole: UserRole, requiredRole?: UserRole): boolean => {
  if (!requiredRole) return true
  
  switch (requiredRole) {
    case 'supervisor':
      return userRole === 'supervisor' || userRole === 'manager'
    case 'manager':
      return userRole === 'manager'
    default:
      return true
  }
}

export function ClientManageLayout({
  children,
  userRole,
  user,
  employee
}: ClientManageLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const currentTab = pathname.split('/').pop() || 'schedule'
  const accessibleTabs = tabs.filter(tab => hasRequiredRole(userRole, tab.requiredRole))

  const handleTabChange = (value: string) => {
    router.push(`/manage/${value}`)
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            {accessibleTabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList 
          className={cn(
            "grid w-full",
            `grid-cols-${accessibleTabs.length}`
          )}
        >
          {accessibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  )
} 