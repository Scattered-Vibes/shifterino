'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ScheduleManager } from './components/ScheduleManager'
import { StaffingOverview } from './components/StaffingOverview'
import { StaffList } from './components/StaffList'
import { TimeOffRequests } from './components/TimeOffRequests'




/**
 * ManagePage - Server Component for the Manager Dashboard.
 *
 * This component fetches the authenticated user and required data from Supabase,
 * verifies that the user holds a valid management role (manager or supervisor),
 * and renders the dashboard interface which includes staffing overview, pending
 * time-off requests, and tabs for schedule and staff management.
 *
 * @returns {Promise<JSX.Element>} The rendered management dashboard.
 */
export default async function ManagePage() {
  const supabase = createClient()

  // Verify authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get current time block
  const now = new Date()
  const hour = now.getHours()
  let timeBlock: string

  if (hour >= 5 && hour < 9) {
    timeBlock = '05:00-09:00'
  } else if (hour >= 9 && hour < 21) {
    timeBlock = '09:00-21:00'
  } else if (hour >= 21 || hour < 1) {
    timeBlock = '21:00-01:00'
  } else {
    timeBlock = '01:00-05:00'
  }

  // Fetch time off requests
  const { data: timeOffRequests } = await supabase
    .from('time_off_requests')
    .select(
      `
      *,
      employee:employees (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('status', 'pending')

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">Management Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Staffing Overview</h2>
          <StaffingOverview timeBlock={timeBlock} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Time Off Requests</h2>
          <TimeOffRequests requests={timeOffRequests || []} />
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule">
            <Card className="p-4">
              <ScheduleManager />
            </Card>
          </TabsContent>
          <TabsContent value="staff">
            <Card className="p-4">
              <StaffList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
