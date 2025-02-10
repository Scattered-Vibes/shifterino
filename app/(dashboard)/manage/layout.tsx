'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter } from 'next/navigation'

export default function ManageLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const currentTab = pathname.split('/').pop() || 'schedule'

  return (
    <div className="flex flex-col gap-6 p-6">
      <Tabs value={currentTab} onValueChange={(value) => router.push(`/manage/${value}`)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="swaps">Shift Swaps</TabsTrigger>
          <TabsTrigger value="on-call">On-Call</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  )
} 