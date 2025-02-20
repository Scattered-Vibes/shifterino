'use client'

import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import type { Database } from '@/types/supabase/database'

type ScheduleWithDetails = Database['public']['Tables']['assigned_shifts']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
  shift_option: Database['public']['Tables']['shift_options']['Row']
}

interface ListViewProps {
  shifts: ScheduleWithDetails[]
}

export function ScheduleList({ shifts }: ListViewProps) {
  return (
    <div className="space-y-4">
      {shifts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No shifts to display.
        </p>
      ) : (
        shifts.map((shift) => (
          <Card key={shift.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">
                    {shift.employee?.first_name} {shift.employee?.last_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {format(new Date(shift.date), 'PPP')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(`1970-01-01T${shift.shift_option.start_time}`), 'h:mm a')} - {format(new Date(`1970-01-01T${shift.shift_option.end_time}`), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}