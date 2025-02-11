'use client'

import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Database } from '@/types/supabase/database'

type ScheduleWithDetails = Database['public']['Tables']['individual_shifts']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
  shift_option: Database['public']['Tables']['shift_options']['Row']
}

interface ListViewProps {
  promise: Promise<ScheduleWithDetails[]>
}

export async function ScheduleList({ promise }: ListViewProps) {
  const shifts = await promise
  return <ListView shifts={shifts} />
}

function ListView({ shifts }: { shifts: ScheduleWithDetails[] }) {
  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = shift.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(shift)
    return acc
  }, {} as Record<string, ScheduleWithDetails[]>)

  // Sort dates
  const sortedDates = Object.keys(shiftsByDate).sort()

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 pr-4">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-2">
            <h3 className="font-medium">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            
            {shiftsByDate[date].map((shift) => (
              <Card key={shift.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {shift.employee.first_name} {shift.employee.last_name}
                      </span>
                      <Badge
                        variant={
                          shift.shift_option.category === 'supervisor'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {shift.shift_option.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(`${date}T${shift.shift_option.start_time}`), 'h:mm a')} -{' '}
                      {format(new Date(`${date}T${shift.shift_option.end_time}`), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 