import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeOffRequests } from './_components/time-off-requests'
import { ShiftSwapRequests } from './_components/shift-swap-requests'
import { OnCallScheduleManager } from './_components/on-call-schedule'
import { TimeOffRequest, ShiftSwapRequest, ShiftEvent, OnCallSchedule } from '@/app/types/shift'

// This would come from your auth context
const isManager = true

// These would come from your database
const mockTimeOffRequests: TimeOffRequest[] = []
const mockShiftSwapRequests: ShiftSwapRequest[] = []
const mockOnCallSchedules: OnCallSchedule[] = []
const mockAvailableShifts: ShiftEvent[] = []
const mockEmployees: Array<{ id: string; name: string }> = []

export const metadata = {
  title: 'Schedule Manager',
  description: 'Manage employee schedules and shifts',
}

export default function SchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-4xl font-bold">Schedule Management</h1>
      
      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="time-off">Time Off</TabsTrigger>
          <TabsTrigger value="swaps">Shift Swaps</TabsTrigger>
          <TabsTrigger value="on-call">On Call</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts">
          <Card className="p-6">
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
              {/* ShiftCalendar component will go here */}
              <div className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Shift Calendar Coming Soon</p>
              </div>
            </Suspense>
          </Card>
        </TabsContent>

        <TabsContent value="time-off">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <TimeOffRequests
              requests={mockTimeOffRequests}
              onSubmit={async (request) => {
                console.log('Submit time off request:', request)
              }}
              onApprove={async (id) => {
                console.log('Approve time off request:', id)
              }}
              onReject={async (id) => {
                console.log('Reject time off request:', id)
              }}
              isManager={isManager}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="swaps">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <ShiftSwapRequests
              requests={mockShiftSwapRequests}
              availableShifts={mockAvailableShifts}
              onSubmit={async (request) => {
                console.log('Submit shift swap request:', request)
              }}
              onApprove={async (id) => {
                console.log('Approve shift swap request:', id)
              }}
              onReject={async (id) => {
                console.log('Reject shift swap request:', id)
              }}
              isManager={isManager}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="on-call">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <OnCallScheduleManager
              schedules={mockOnCallSchedules}
              employees={mockEmployees}
              onSubmit={async (schedule) => {
                console.log('Submit on-call schedule:', schedule)
              }}
              onDelete={async (id) => {
                console.log('Delete on-call schedule:', id)
              }}
              isManager={isManager}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
} 