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
import { useMediaQuery } from '@/hooks/use-media-query'

interface Tab {
  value: string
  label: string
  requiredRole?: 'DISPATCHER' | 'SUPERVISOR' | 'MANAGER'
}

const tabs: Tab[] = [
  { value: 'schedule', label: 'Schedule' },
  { 
    value: 'overtime', 
    label: 'Overtime',
    requiredRole: 'SUPERVISOR'
  },
  { value: 'swaps', label: 'Shift Swaps' },
  { 
    value: 'on-call', 
    label: 'On-Call',
    requiredRole: 'SUPERVISOR'
  },
  { 
    value: 'reports', 
    label: 'Reports',
    requiredRole: 'MANAGER'
  },
]

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

  const currentTab = pathname.split('/').pop() || 'schedule'
  
  // Filter tabs based on user role
  const accessibleTabs = tabs.filter(tab => {
    if (!tab.requiredRole) return true
    if (tab.requiredRole === 'SUPERVISOR') {
      return userRole === 'SUPERVISOR' || userRole === 'MANAGER'
    }
    if (tab.requiredRole === 'MANAGER') {
      return userRole === 'MANAGER'
    }
    return true
  })

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