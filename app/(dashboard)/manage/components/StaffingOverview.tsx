'use client'

import { Progress } from '@/components/ui/progress'

interface Schedule {
  id: string
  employee_id: string
  shift_type: string
  is_supervisor: boolean
  start_date: string
  end_date: string
  status: string
}

interface StaffingOverviewProps {
  schedules: Schedule[]
}

export function StaffingOverview({ schedules }: StaffingOverviewProps) {
  // Define staffing requirements based on schema
  const staffingRequirements = [
    { period: '5 AM - 9 AM', required: 6, supervisors: 1 },
    { period: '9 AM - 9 PM', required: 8, supervisors: 1 },
    { period: '9 PM - 1 AM', required: 7, supervisors: 1 },
    { period: '1 AM - 5 AM', required: 6, supervisors: 1 },
  ]

  // Count current staff and supervisors for each period
  // TODO: Implement period-based filtering once we have proper shift time handling
  const getCurrentStaffing = () => {
    // This is a simplified version - in production, we'd need to handle:
    // - Time zone conversions
    // - Shift overlaps
    // - Status checks (approved, etc)
    const activeSchedules = schedules.filter((s) => s.status === 'published')
    const staffCount = activeSchedules.length
    const supervisorCount = activeSchedules.filter(
      (s) => s.is_supervisor
    ).length

    return {
      total: staffCount,
      supervisors: supervisorCount,
    }
  }

  return (
    <div className="space-y-4">
      {staffingRequirements.map((req) => {
        const current = getCurrentStaffing()
        const staffingPercentage = Math.min(
          (current.total / req.required) * 100,
          100
        )

        return (
          <div key={req.period} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{req.period}</span>
              <span className="text-muted-foreground">
                {current.total}/{req.required} Staff ({current.supervisors}/
                {req.supervisors} Supervisors)
              </span>
            </div>
            <Progress
              value={staffingPercentage}
              className={
                staffingPercentage < 100 ? 'bg-red-200' : 'bg-green-200'
              }
            />
          </div>
        )
      })}
    </div>
  )
}
