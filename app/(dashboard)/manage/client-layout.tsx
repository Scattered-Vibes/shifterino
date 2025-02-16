'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMediaQuery } from '@/lib/hooks/client/use-media-query'
import { useSupabase } from '@/app/providers/SupabaseContext'

type Role = 'dispatcher' | 'supervisor' | 'manager'

interface Tab {
  value: string
  label: string
  requiredRole?: Role
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

const hasRequiredRole = (userRole: Role, requiredRole?: Role): boolean => {
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
}: {
  children: React.ReactNode
  userRole: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { user, employee, isLoading } = useSupabase()

  const currentTab = pathname.split('/').pop() || 'schedule'

  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (!user || !employee) {
    return <div>Not authorized.</div>
  }

  const role = userRole.toLowerCase() as Role

  const accessibleTabs = tabs.filter(tab => hasRequiredRole(role, tab.requiredRole))

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