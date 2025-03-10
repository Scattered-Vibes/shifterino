'use server'

import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScheduleCalendar } from './calendar-view'
import { ScheduleList } from './list-view'
import { CreateScheduleButton } from './create-button'
import { ScheduleFilters } from './filters'
import { ScheduleCalendarSkeleton } from './loading'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { requireAuth } from '@/lib/auth/server'
import type { Database } from '@/types/supabase/database'

type ScheduleWithDetails = Database['public']['Tables']['assigned_shifts']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row'];
  shift: Database['public']['Tables']['shifts']['Row'];
}

async function getSchedules(startDate: string, endDate: string): Promise<ScheduleWithDetails[]> {
  const supabase = await createServerSupabaseClient()

  const { data: shifts, error } = await supabase
    .from('assigned_shifts')
    .select(`
      *,
      employee:employees(*),
      shift:shifts(*)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .returns<ScheduleWithDetails[]>()

  if (error) throw error
  return shifts || []
}

export default async function SchedulesPage() {
  try {
    // Verify authentication
    await requireAuth()

    // Get current month's date range
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedules</h1>
            <p className="text-muted-foreground">
              View and manage employee schedules.
            </p>
          </div>
          <CreateScheduleButton />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Schedule View</CardTitle>
              <ScheduleFilters />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calendar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <ErrorBoundary>
                  <Suspense fallback={<ScheduleCalendarSkeleton />}>
                    {/* @ts-expect-error Async Server Component */}
                    <ScheduleData startDate={startDate} endDate={endDate}>
                      {(shifts) => <ScheduleCalendar shifts={shifts} />}
                    </ScheduleData>
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>
              
              <TabsContent value="list" className="space-y-4">
                <ErrorBoundary>
                  <Suspense fallback={<ScheduleCalendarSkeleton />}>
                    {/* @ts-expect-error Async Server Component */}
                    <ScheduleData startDate={startDate} endDate={endDate}>
                      {(shifts) => <ScheduleList shifts={shifts} />}
                    </ScheduleData>
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    throw handleError(error)
  }
}

async function ScheduleData({ 
  startDate, 
  endDate,
  children 
}: { 
  startDate: string
  endDate: string
  children: (shifts: ScheduleWithDetails[]) => React.ReactNode 
}) {
  const shifts = await getSchedules(startDate, endDate)
  return children(shifts)
}
