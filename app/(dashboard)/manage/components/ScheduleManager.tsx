'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import RealtimeSchedule from './RealtimeSchedule'
import type { Schedule, Employee } from '@/app/_types/database'

/**
 * Props for the ScheduleManager component.
 */
interface ScheduleManagerProps {
  currentSchedule: Schedule[]
  employees: Employee[]
}

/**
 * ScheduleManager Component
 *
 * This client-side component provides an interface to manage employee schedules.
 * It displays a calendar for selecting a date, a table of shifts for the selected date,
 * and a dialog to add new shifts to the schedule.
 *
 * @param {ScheduleManagerProps} props - Component properties including current schedules and employee list.
 * @returns React element representing the schedule management UI.
 */
export default function ScheduleManager({ currentSchedule, employees }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(currentSchedule)

  const handleScheduleUpdate = (updatedSchedule: Schedule) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule
      )
    )
  }

  return (
    <div className="space-y-4">
      <RealtimeSchedule onScheduleUpdate={handleScheduleUpdate} />
      
      <div className="grid gap-4">
        {schedules.map(schedule => (
          <Card key={schedule.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Shift {schedule.id}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(schedule.start_time).toLocaleString()} - 
                  {new Date(schedule.end_time).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Add edit/delete buttons here */}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 