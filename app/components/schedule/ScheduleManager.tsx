import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Schedule, ScheduleGenerationOptions } from '@/types/scheduling/schedule'
import { generateSchedule } from '@/lib/scheduling/generate'
import { validateSchedule } from '@/lib/scheduling/validation'
import { resolveConflicts } from '@/lib/scheduling/conflicts'

interface ScheduleManagerProps {
  supabase: SupabaseClient
}

export default function ScheduleManager({ supabase }: ScheduleManagerProps) {
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedShift, setSelectedShift] = useState<string>()

  const handleGenerateSchedule = async (options: ScheduleGenerationOptions) => {
    try {
      // Generate schedule
      const newSchedule = await generateSchedule(options, supabase)
      
      // Validate schedule
      const validation = await validateSchedule(newSchedule)
      if (!validation.isValid) {
        setError(validation.errors?.join(', '))
        return
      }

      setSchedule(newSchedule)
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    }
  }

  const handleShiftUpdate = async (shiftId: string, updates: Partial<Schedule>) => {
    try {
      // Update shift
      const updatedSchedule = schedule.map(shift =>
        shift.id === shiftId ? { ...shift, ...updates } : shift
      )

      // Check for conflicts
      const { conflicts } = await resolveConflicts(updatedSchedule)
      if (conflicts.length > 0) {
        setError('Schedule conflict detected')
        return
      }

      setSchedule(updatedSchedule)
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shift')
    }
  }

  const handlePublish = async () => {
    try {
      // Validate before publishing
      const validation = await validateSchedule(schedule)
      if (!validation.isValid) {
        setError(validation.errors?.join(', '))
        return
      }

      // Update status in database
      const { error: dbError } = await supabase
        .from('schedules')
        .update({ status: 'published' })
        .in('id', schedule.map(s => s.id))

      if (dbError) throw dbError

      setStatus('published')
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish schedule')
    }
  }

  return (
    <div>
      {/* Schedule Generation Form */}
      <div>
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          id="startDate"
          aria-label="Start Date"
        />

        <label htmlFor="endDate">End Date</label>
        <input
          type="date"
          id="endDate"
          aria-label="End Date"
        />

        <button onClick={() => handleGenerateSchedule({
          startDate: '2025-02-01T00:00:00Z',
          endDate: '2025-02-28T23:59:59Z',
          constraints: {
            maxHoursPerWeek: 40,
            minRestHours: 8,
            preferredShiftPatterns: true,
            balanceWorkload: true
          }
        })}>
          Generate Schedule
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div data-testid="error-message" className="error">
          {error}
        </div>
      )}

      {/* Schedule Grid */}
      <div data-testid="schedule-grid">
        {schedule.map((shift) => (
          <div
            key={shift.id}
            data-testid={`schedule-item-${shift.id}`}
            onClick={() => setSelectedShift(shift.id)}
          >
            {/* Shift details */}
            <div>{shift.date}</div>
            <div>{shift.employeeId}</div>
            <div>{shift.status}</div>

            {/* Shift Editor */}
            {selectedShift === shift.id && (
              <div>
                <label htmlFor="shiftTime">Shift Time</label>
                <input
                  type="time"
                  id="shiftTime"
                  aria-label="Shift Time"
                  onChange={(e) => handleShiftUpdate(shift.id, {
                    date: `${shift.date.split('T')[0]}T${e.target.value}:00Z`
                  })}
                />

                <label htmlFor="employeeSelect">Select Employee</label>
                <select
                  id="employeeSelect"
                  aria-label="Select Employee"
                  onChange={(e) => handleShiftUpdate(shift.id, {
                    employeeId: e.target.value
                  })}
                >
                  <option value="">Select...</option>
                  <option value="456">Jane Smith</option>
                </select>

                <button onClick={() => setSelectedShift(undefined)}>
                  Confirm
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Status */}
      <div data-testid="schedule-status">
        {status}
      </div>

      {/* Publish Button */}
      {status === 'draft' && (
        <button onClick={handlePublish}>
          Publish Schedule
        </button>
      )}
    </div>
  )
} 