import React from 'react'
import { type TimeBlock } from '@/types/schedule'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StaffingOverviewProps {
  date: Date;
  timeBlocks: TimeBlock[];
}

export function StaffingOverview({ date, timeBlocks }: StaffingOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold leading-none">{formatDate(date)}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {timeBlocks.map((block) => {
          const isUnderstaffed = block.currentStaff < block.minStaff
          const staffingDiff = block.minStaff - block.currentStaff

          return (
            <Card 
              key={`${block.startTime}-${block.endTime}`}
              className={cn(
                isUnderstaffed && "border-red-500"
              )}
            >
              <CardHeader>
                <CardTitle>
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Required: {block.minStaff}</p>
                <p className={cn(
                  "font-medium",
                  isUnderstaffed ? "text-red-500" : "text-green-500"
                )}>
                  Current: {block.currentStaff}
                </p>
                <p>Supervisors: {block.supervisors}</p>
                {isUnderstaffed && (
                  <p className="text-sm text-red-500 font-medium">
                    Understaffed by {staffingDiff}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 