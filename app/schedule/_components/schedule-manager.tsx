'use client'

import { useState } from 'react'
import { useShifts } from '@/lib/hooks/use-shifts'
import { ShiftCalendar } from './shift-calendar'
import { ShiftUpdateForm } from './shift-update-form'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, UsersIcon } from '@radix-ui/react-icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StaffingRequirements } from './staffing-requirements'
import type { ShiftEvent } from '@/types/shift'

export function ScheduleManager() {
  const [selectedShift, setSelectedShift] = useState<ShiftEvent | null>(null)
  const [view, setView] = useState<'calendar' | 'staffing'>('calendar')
  const { shifts, events, isLoading, error, updateShift, refetch } = useShifts()

  const handleEventClick = (event: ShiftEvent) => {
    setSelectedShift(event)
  }

  const handleShiftUpdate = async (shiftId: string, updateData: any) => {
    try {
      await updateShift(shiftId, updateData)
      setSelectedShift(null)
      await refetch()
    } catch (error) {
      console.error('Error updating shift:', error)
    }
  }

  if (error) {
    throw error
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <Card className="p-6">
          <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'staffing')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="staffing">
                <UsersIcon className="mr-2 h-4 w-4" />
                Staffing Requirements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setSelectedShift(null)}>
                  Add Shift
                </Button>
              </div>

              <ShiftCalendar
                events={events}
                isLoading={isLoading}
                onEventClick={handleEventClick}
              />
            </TabsContent>

            <TabsContent value="staffing" className="mt-6">
              <StaffingRequirements shifts={shifts} />
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