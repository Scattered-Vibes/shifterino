'use client'

import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Schedule } from '@/types/database'
import { TIME_PERIODS } from '@/types/database'

/**
 * Props for the StaffingOverview component.
 *
 * @interface StaffingOverviewProps
 * @property {Array<Schedule & { employee: { first_name: string, last_name: string, is_supervisor: boolean } }>} schedules 
 *  - The list of scheduled shifts including employee details.
 */
interface StaffingOverviewProps {
  schedules: Array<Schedule & {
    employee: {
      first_name: string
      last_name: string
      is_supervisor: boolean
    }
  }>
}

/**
 * StaffingOverview Component
 *
 * This client component calculates and displays staffing levels for each defined time period.
 * It uses the TIME_PERIODS configuration to determine the required staffing and compares it
 * with actual scheduled staff, including a count of supervisors per period.
 *
 * @param {StaffingOverviewProps} props - The component props containing scheduling details.
 * @returns {JSX.Element} A table representing current staffing levels and statuses.
 */
export default function StaffingOverview({ schedules }: StaffingOverviewProps) {
  // Memoize the staffing level calculations to avoid expensive recomputation on every render.
  const staffingLevels = useMemo(() => {
    // Map through each defined time period from TIME_PERIODS
    const levels = Object.entries(TIME_PERIODS).map(([period, { start, end, min_staff }]) => {
      // Filter schedules that fall into the current time period.
      const staffInPeriod = schedules.filter(schedule => {
        const scheduleStart = schedule.start_time
        const scheduleEnd = schedule.end_time
        // Check if the scheduled shift overlaps with the time period.
        return (
          (scheduleStart >= start && scheduleStart < end) ||
          (scheduleEnd > start && scheduleEnd <= end) ||
          (scheduleStart <= start && scheduleEnd >= end)
        )
      })

      // Identify supervisors within the filtered list.
      const supervisors = staffInPeriod.filter(s => s.employee.is_supervisor)

      // Return the staffing summary for the period.
      return {
        period,
        start,
        end,
        min_staff,
        current_staff: staffInPeriod.length,
        supervisors: supervisors.length,
        status: staffInPeriod.length >= min_staff ? 'ok' : 'understaffed'
      }
    })

    return levels
  }, [schedules])

  // Render a table to display the staffing overview.
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time Period</TableHead>
          <TableHead>Required Staff</TableHead>
          <TableHead>Current Staff</TableHead>
          <TableHead>Supervisors</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staffingLevels.map(level => (
          <TableRow key={level.period}>
            <TableCell>
              {level.start}-{level.end}
            </TableCell>
            <TableCell>{level.min_staff}</TableCell>
            <TableCell>{level.current_staff}</TableCell>
            <TableCell>{level.supervisors}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                level.status === 'ok' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {level.status === 'ok' ? 'Adequate' : 'Understaffed'}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 