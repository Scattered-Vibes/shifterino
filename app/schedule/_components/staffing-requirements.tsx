'use client'

import { useMemo } from 'react'
import type { Shift } from '@/types/shift'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StaffingRequirementsProps {
  shifts: Shift[]
}

interface StaffingPeriod {
  startTime: string
  endTime: string
  minStaff: number
  currentStaff: number
  isMet: boolean
}

const STAFFING_PERIODS: StaffingPeriod[] = [
  { startTime: '05:00', endTime: '09:00', minStaff: 6, currentStaff: 0, isMet: false },
  { startTime: '09:00', endTime: '21:00', minStaff: 8, currentStaff: 0, isMet: false },
  { startTime: '21:00', endTime: '01:00', minStaff: 7, currentStaff: 0, isMet: false },
  { startTime: '01:00', endTime: '05:00', minStaff: 6, currentStaff: 0, isMet: false },
]

export function StaffingRequirements({ shifts }: StaffingRequirementsProps) {
  const staffingStatus = useMemo(() => {
    const periods = [...STAFFING_PERIODS]
    
    shifts.forEach(shift => {
      const shiftStart = new Date(shift.actual_start_time as string)
      const shiftEnd = new Date(shift.actual_end_time as string)
      
      periods.forEach(period => {
        const [periodStartHour, periodStartMinute] = period.startTime.split(':').map(Number)
        const [periodEndHour, periodEndMinute] = period.endTime.split(':').map(Number)
        
        const periodStart = new Date(shiftStart)
        periodStart.setHours(periodStartHour, periodStartMinute, 0)
        
        const periodEnd = new Date(shiftStart)
        periodEnd.setHours(periodEndHour, periodEndMinute, 0)
        
        // Handle periods that cross midnight
        if (periodEndHour < periodStartHour) {
          periodEnd.setDate(periodEnd.getDate() + 1)
        }
        
        if (
          (shiftStart <= periodEnd && shiftEnd >= periodStart) ||
          (shiftStart <= periodEnd && shiftEnd >= periodStart)
        ) {
          period.currentStaff++
        }
      })
    })
    
    return periods.map(period => ({
      ...period,
      isMet: period.currentStaff >= period.minStaff
    }))
  }, [shifts])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staffing Requirements</CardTitle>
        <CardDescription>
          Current staffing levels compared to minimum requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time Period</TableHead>
              <TableHead>Minimum Required</TableHead>
              <TableHead>Current Staff</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffingStatus.map((period, index) => (
              <TableRow key={index}>
                <TableCell>
                  {period.startTime} - {period.endTime}
                </TableCell>
                <TableCell>{period.minStaff}</TableCell>
                <TableCell>{period.currentStaff}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      period.isMet
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {period.isMet ? 'Met' : 'Not Met'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 