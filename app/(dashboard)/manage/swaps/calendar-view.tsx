'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row'] & {
  requester: Database['public']['Tables']['employees']['Row']
  requested_employee: Database['public']['Tables']['employees']['Row']
  original_shift: Database['public']['Tables']['individual_shifts']['Row'] & {
    shift_option: Database['public']['Tables']['shift_options']['Row']
  }
  proposed_shift: Database['public']['Tables']['individual_shifts']['Row'] & {
    shift_option: Database['public']['Tables']['shift_options']['Row']
  }
}

export interface CalendarViewProps {
  data: ShiftSwapRequest[]
}

function formatShiftTime(shift: ShiftSwapRequest['original_shift']) {
  return `${format(new Date(shift.date), 'MMM d')} - ${format(
    new Date(`2000-01-01T${shift.shift_option.start_time}`),
    'h:mm a'
  )} to ${format(new Date(`2000-01-01T${shift.shift_option.end_time}`), 'h:mm a')}`
}

function getStatusBadgeVariant(status: Database['public']['Enums']['time_off_status']) {
  switch (status) {
    case 'approved':
      return 'default'
    case 'rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function CalendarView({ data }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Filter requests for the selected date
  const selectedDateRequests = data.filter((request) => {
    const originalDate = new Date(request.original_shift.date)
    const proposedDate = new Date(request.proposed_shift.date)
    const selectedDate = date

    if (!selectedDate) return false

    return (
      originalDate.toDateString() === selectedDate.toDateString() ||
      proposedDate.toDateString() === selectedDate.toDateString()
    )
  })

  // Get all dates with requests for highlighting in calendar
  const datesWithRequests = data.reduce((dates, request) => {
    const originalDate = new Date(request.original_shift.date)
    const proposedDate = new Date(request.proposed_shift.date)
    
    dates.add(originalDate.toDateString())
    dates.add(proposedDate.toDateString())
    
    return dates
  }, new Set<string>())

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{
              hasRequests: (date) => datesWithRequests.has(date.toDateString()),
            }}
            modifiersStyles={{
              hasRequests: {
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '4px',
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Shift Swaps for{' '}
            {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {selectedDateRequests.length > 0 ? (
              <div className="space-y-4">
                {selectedDateRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="font-medium">
                          {request.requester.first_name} {request.requester.last_name}
                          {' → '}
                          {request.requested_employee.first_name}{' '}
                          {request.requested_employee.last_name}
                        </div>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Original Shift:</strong>{' '}
                          {formatShiftTime(request.original_shift)}
                        </div>
                        <div>
                          <strong>Proposed Shift:</strong>{' '}
                          {formatShiftTime(request.proposed_shift)}
                        </div>
                        {request.notes && (
                          <div>
                            <strong>Notes:</strong> {request.notes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                No shift swaps found for this date.
              </div>
            )}
          </ScrollArea>
        </CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {selectedDateRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Swap Request #{request.id.slice(0, 8)}
                      </CardTitle>
                      <Badge
                        variant={
                          request.status === 'approved'
                            ? 'default'
                            : request.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium">Original Shift</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.requester.first_name}{' '}
                          {request.requester.last_name}
                        </p>
                        <p className="text-sm">
                          {format(
                            new Date(request.original_shift.date),
                            'MMM d'
                          )}{' '}
                          -{' '}
                          {format(
                            new Date(
                              `2000-01-01T${request.original_shift.shift_option.start_time}`
                            ),
                            'h:mm a'
                          )}{' '}
                          to{' '}
                          {format(
                            new Date(
                              `2000-01-01T${request.original_shift.shift_option.end_time}`
                            ),
                            'h:mm a'
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Proposed Shift</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.requested_employee.first_name}{' '}
                          {request.requested_employee.last_name}
                        </p>
                        <p className="text-sm">
                          {format(
                            new Date(request.proposed_shift.date),
                            'MMM d'
                          )}{' '}
                          -{' '}
                          {format(
                            new Date(
                              `2000-01-01T${request.proposed_shift.shift_option.start_time}`
                            ),
                            'h:mm a'
                          )}{' '}
                          to{' '}
                          {format(
                            new Date(
                              `2000-01-01T${request.proposed_shift.shift_option.end_time}`
                            ),
                            'h:mm a'
                          )}
                        </p>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium">Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {selectedDateRequests.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No swap requests found for this date.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 