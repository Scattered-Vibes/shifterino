'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { browserClient } from '@/lib/supabase/clientInstance'
import type { Database } from '@/types/supabase/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/index'

type Tables = Database['public']['Tables']
type StaffingRequirement = Tables['staffing_requirements']['Row']
type ShiftOption = Tables['shifts']['Row'] & {
  requires_supervisor: boolean
}
type IndividualShift = Tables['assigned_shifts']['Row'] & {
  shift_option: ShiftOption | null
}
type StaffingGap = {
  time_block_start: string
  time_block_end: string
  required_count: number
  actual_count: number
  missing_supervisor: boolean
}

interface StaffingOverviewProps {
  date: Date
}

export function StaffingOverview({ date }: StaffingOverviewProps) {
  const componentId = Math.random().toString(36).substring(7)

  useEffect(() => {
    console.log(`[StaffingOverview:${componentId}] Component mounted with date:`, {
      date: date.toISOString(),
      timestamp: new Date().toISOString()
    })

    return () => {
      console.log(`[StaffingOverview:${componentId}] Component unmounting`)
    }
  }, [date, componentId])

  const { data: staffingLevels, error } = useQuery({
    queryKey: ['staffing-levels', date.toISOString()],
    queryFn: async () => {
      console.log(`[StaffingOverview:${componentId}] Starting data fetch`)
      const fetchStart = Date.now()

      try {
        const dayOfWeek = date.getDay().toString()
        const dateString = date.toISOString().split('T')[0]

        const [requirementsResult, shiftsResult] = await Promise.all([
          browserClient
            .from('staffing_requirements')
            .select()
            .eq('day_of_week', dayOfWeek as any)
            .order('start_time')
            .throwOnError(),
          browserClient
            .from('individual_shifts')
            .select('*, shift_option:shift_options(*)')
            .eq('date', dateString as any)
            .throwOnError()
        ])

        console.log(`[StaffingOverview:${componentId}] Database queries completed in ${Date.now() - fetchStart}ms`)

        const requirements = requirementsResult.data as unknown as StaffingRequirement[]
        const shifts = shiftsResult.data as unknown as IndividualShift[]

        console.log(`[StaffingOverview:${componentId}] Data fetched successfully:`, {
          requirementsCount: requirements.length,
          shiftsCount: shifts.length,
          timeElapsed: Date.now() - fetchStart
        })

        return calculateStaffingLevels(requirements, shifts)
      } catch (error) {
        console.error(`[StaffingOverview:${componentId}] Error fetching data:`, {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : 'Unknown error type',
          timeElapsed: Date.now() - fetchStart
        })
        throw error
      }
    }
  })

  useEffect(() => {
    if (error) {
      console.error(`[StaffingOverview:${componentId}] Query error:`, {
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : 'Unknown error type'
      })
    }
  }, [error, componentId])

  if (error) {
    throw error
  }

  if (!staffingLevels) {
    console.log(`[StaffingOverview:${componentId}] No data available yet`)
    return null
  }

  console.log(`[StaffingOverview:${componentId}] Rendering with data:`, {
    levelsCount: staffingLevels.length,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {staffingLevels.map((level) => {
        const percentage = (level.actual_count / level.required_count) * 100
        let progressClass = 'bg-red-500'
        
        if (percentage >= 100) {
          progressClass = 'bg-green-500'
        } else if (percentage >= 75) {
          progressClass = 'bg-yellow-500'
        }

        return (
          <Card key={`${level.time_block_start}-${level.time_block_end}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {formatTimeRange(level.time_block_start, level.time_block_end)}
              </CardTitle>
              <span className={level.missing_supervisor ? 'text-red-500' : 'text-green-500'}>
                {level.missing_supervisor ? 'No Supervisor' : 'Supervisor Present'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {level.actual_count} / {level.required_count}
              </div>
              <Progress 
                value={percentage} 
                className={cn("mt-2", progressClass)}
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function calculateStaffingLevels(
  requirements: StaffingRequirement[],
  shifts: IndividualShift[]
): StaffingGap[] {
  return requirements.map(req => {
    const shiftsInPeriod = shifts.filter(shift => 
      isShiftInPeriod(shift, req.start_time, req.end_time)
    )

    const supervisorPresent = shiftsInPeriod.some(shift => 
      shift.shift_option?.requires_supervisor
    )

    return {
      time_block_start: req.start_time,
      time_block_end: req.end_time,
      required_count: req.min_total_staff,
      actual_count: shiftsInPeriod.length,
      missing_supervisor: !supervisorPresent && req.min_supervisors > 0
    }
  })
}

function isShiftInPeriod(
  shift: IndividualShift,
  periodStart: string,
  periodEnd: string
): boolean {
  const shiftStart = new Date(`1970-01-01T${shift.shift_option?.start_time}`)
  const shiftEnd = new Date(`1970-01-01T${shift.shift_option?.end_time}`)
  const start = new Date(`1970-01-01T${periodStart}`)
  const end = new Date(`1970-01-01T${periodEnd}`)

  return shiftStart <= end && shiftEnd >= start
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

function formatTime(time: string): string {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
} 