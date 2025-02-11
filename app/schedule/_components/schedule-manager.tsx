'use client'

import { useState } from 'react'
import { useShifts, useTimeOff, useShiftSwaps } from '@/lib/hooks'
import { ShiftCalendar } from './shift-calendar'
import { ShiftUpdateForm } from './shift-update-form'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CalendarIcon, 
  ClockIcon,
  BellIcon 
} from '@radix-ui/react-icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StaffingRequirements } from './staffing-requirements'
import { TimeOffRequests } from './time-off-requests'
import { ShiftSwapRequests } from './shift-swap-requests'
import { OnCallSchedule } from './on-call-schedule'
import type { ShiftEvent, Duration } from '@/app/types/shift'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { validateShiftPattern } from '@/app/lib/utils/shift-patterns'

const STAFFING_REQUIREMENTS = [
  { timeStart: '05:00', timeEnd: '09:00', minStaff: 6, supervisorRequired: true },
  { timeStart: '09:00', timeEnd: '21:00', minStaff: 8, supervisorRequired: true },
  { timeStart: '21:00', timeEnd: '01:00', minStaff: 7, supervisorRequired: true },
  { timeStart: '01:00', timeEnd: '05:00', minStaff: 6, supervisorRequired: true }
]

export function ScheduleManager() {
  const [selectedShift, setSelectedShift] = useState<ShiftEvent | null>(null)
  const [view, setView] = useState<'calendar' | 'staffing' | 'time-off' | 'swaps' | 'on-call'>('calendar')

  // Helper function to create a new shift.
  // This object serves as a template for the "Add Shift" functionality.
  const createEmptyShift = (): ShiftEvent => {
    return {
      id: 'new',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(), // default duration: 1 hour
      // Add any additional default properties here as required.
    }
  }

  const { 
    shifts, 
    events, 
    isLoading: shiftsLoading, 
    error: shiftsError,
    updateShift,
    refetch: refetchShifts
  } = useShifts()

  const {
    timeOffRequests,
    isLoading: timeOffLoading,
    error: timeOffError,
    approveTimeOff,
    rejectTimeOff
  } = useTimeOff()

  const {
    swapRequests,
    isLoading: swapsLoading,
    error: swapsError,
    approveSwap,
    rejectSwap
  } = useShiftSwaps()

  const handleEventClick = (event: ShiftEvent) => {
    setSelectedShift(event)
  }

  const handleEventDrop = async (event: ShiftEvent, delta: Duration) => {
    try {
      const updatedStart = new Date(event.start)
      const updatedEnd = new Date(event.end)

      updatedStart.setDate(updatedStart.getDate() + delta.days)
      updatedStart.setHours(updatedStart.getHours() + delta.hours)
      updatedEnd.setDate(updatedEnd.getDate() + delta.days)
      updatedEnd.setHours(updatedEnd.getHours() + delta.hours)

      const updatedEvent = {
        ...event,
        start: updatedStart.toISOString(),
        end: updatedEnd.toISOString()
      }

      if (!validateShiftPattern(updatedEvent, events)) {
        throw new Error('Invalid shift pattern')
      }

      await updateShift(event.id, updatedEvent)
      await refetchShifts()
    } catch (error) {
      console.error('Error updating shift (drop). Use Supabase CLI for debugging:', error)
    }
  }

  const handleEventResize = async (event: ShiftEvent, delta: Duration) => {
    try {
      const updatedEnd = new Date(event.end)
      updatedEnd.setHours(updatedEnd.getHours() + delta.hours)

      const updatedEvent = {
        ...event,
        end: updatedEnd.toISOString()
      }

      if (!validateShiftPattern(updatedEvent, events)) {
        throw new Error('Invalid shift pattern')
      }

      await updateShift(event.id, updatedEvent)
      await refetchShifts()
    } catch (error) {
      console.error('Error updating shift (resize). Use Supabase CLI for debugging:', error)
    }
  }

  const handleShiftUpdate = async (shiftId: string, updateData: Partial<ShiftEvent>) => {
    try {
      if (shiftId === 'new') {
        // For a new shift, we assume updateShift will handle insertion.
        await updateShift(shiftId, updateData)
      } else {
        await updateShift(shiftId, updateData)
      }
      setSelectedShift(null)
      await refetchShifts()
    } catch (error) {
      console.error('Error updating shift (form submission). Use Supabase CLI for debugging:', error)
    }
  }

  if (shiftsError || timeOffError || swapsError) {
    throw shiftsError || timeOffError || swapsError
  }

  const pendingTimeOff = timeOffRequests?.filter(req => !req.reviewedAt).length ?? 0
  const pendingSwaps = swapRequests?.filter(req => !req.reviewedAt).length ?? 0

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <Card className="p-6">
          <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'staffing' | 'time-off' | 'swaps' | 'on-call')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="staffing">
                <UsersIcon className="mr-2 h-4 w-4" />
                Staffing Requirements
              </TabsTrigger>
              <TabsTrigger value="time-off">
                <ClockIcon className="mr-2 h-4 w-4" />
                Time Off
                {pendingTimeOff > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingTimeOff}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="swaps">
                <SwapIcon className="mr-2 h-4 w-4" />
                Shift Swaps
                {pendingSwaps > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingSwaps}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="on-call">
                <BellIcon className="mr-2 h-4 w-4" />
                On-Call
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setSelectedShift(createEmptyShift())}>
                  Add Shift
                </Button>
              </div>

              <ShiftCalendar
                events={events}
                isLoading={shiftsLoading}
                staffingRequirements={STAFFING_REQUIREMENTS}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
              />
            </TabsContent>

            <TabsContent value="staffing" className="mt-6">
              <StaffingRequirements 
                shifts={shifts}
                requirements={STAFFING_REQUIREMENTS}
              />
            </TabsContent>

            <TabsContent value="time-off" className="mt-6">
              <TimeOffRequests
                requests={timeOffRequests}
                isLoading={timeOffLoading}
                onApprove={approveTimeOff}
                onReject={rejectTimeOff}
              />
            </TabsContent>

            <TabsContent value="swaps" className="mt-6">
              <ShiftSwapRequests
                requests={swapRequests}
                isLoading={swapsLoading}
                onApprove={approveSwap}
                onReject={rejectSwap}
              />
            </TabsContent>

            <TabsContent value="on-call" className="mt-6">
              <OnCallSchedule />
            </TabsContent>
          </Tabs>
        </Card>

        {selectedShift && (
          <Card className="p-6">
            <ShiftUpdateForm
              shift={selectedShift}
              onUpdate={handleShiftUpdate}
              onCancel={() => setSelectedShift(null)}
            />
          </Card>
        )}
      </div>
    </ErrorBoundary>
  )
}