'use client'

import { Card } from '@/components/ui/card'
import { format } from 'date-fns'

interface StaffingLevel {
  timeBlock: string
  required: number
  actual: number
  supervisors: number
}

interface StaffingOverviewProps {
  date: Date
  staffingLevels: StaffingLevel[]
}

export function StaffingOverview({ date, staffingLevels }: StaffingOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Staffing Overview - {format(date, 'MMMM d, yyyy')}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {staffingLevels.map((level) => (
          <Card key={level.timeBlock} className="p-4">
            <h3 className="mb-2 font-medium">{level.timeBlock}</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Required: {level.required}
              </p>
              <p className="text-sm text-muted-foreground">
                Actual: {level.actual}
              </p>
              <p className="text-sm text-muted-foreground">
                Supervisors: {level.supervisors}
              </p>
              {level.actual < level.required && (
                <p className="mt-2 text-sm font-medium text-destructive">
                  Understaffed by {level.required - level.actual}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
