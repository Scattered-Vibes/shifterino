'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useShiftSubscription } from '@/app/hooks/useRealtimeSubscription'
import { IndividualShift } from '@/types/scheduling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function OvertimePage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch schedule periods
  const { data: periods } = useQuery({
    queryKey: ['schedulePeriods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_periods')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(12)

      if (error) throw error
      return data
    }
  })

  // Fetch overtime requests
  const { data: overtimeRequests } = useQuery({
    queryKey: ['overtimeRequests', selectedPeriodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name
          ),
          shift_options (
            id,
            start_time,
            end_time,
            duration_hours
          )
        `)
        .eq('schedule_period_id', selectedPeriodId)
        .eq('requested_overtime', true)
        .is('overtime_approved_by', null)
        .order('date', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!selectedPeriodId
  })

  // Subscribe to real-time updates
  useShiftSubscription({
    id: selectedPeriodId,
    queryKey: ['overtimeRequests', selectedPeriodId]
  })

  // Approve overtime mutation
  const approveMutation = useMutation({
    mutationFn: async ({ shiftId, approve }: { shiftId: string; approve: boolean }) => {
      const { error } = await supabase
        .from('individual_shifts')
        .update({
          overtime_approved_by: approve ? 'current-user-id' : null, // TODO: Get actual user ID
          overtime_approved_at: approve ? new Date().toISOString() : null
        })
        .eq('id', shiftId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeRequests', selectedPeriodId] })
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overtime Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {periods?.map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriodId === period.id ? 'default' : 'outline'}
                onClick={() => setSelectedPeriodId(period.id)}
              >
                {format(new Date(period.start_date), 'MMM d')} -{' '}
                {format(new Date(period.end_date), 'MMM d, yyyy')}
              </Button>
            ))}
          </div>

          {selectedPeriodId && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overtimeRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.employees.first_name} {request.employees.last_name}
                    </TableCell>
                    <TableCell>{format(new Date(request.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {format(new Date(`2000-01-01T${request.shift_options.start_time}`), 'h:mm a')} -{' '}
                      {format(new Date(`2000-01-01T${request.shift_options.end_time}`), 'h:mm a')}
                    </TableCell>
                    <TableCell>{request.overtime_hours || request.shift_options.duration_hours}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ shiftId: request.id, approve: true })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate({ shiftId: request.id, approve: false })}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {overtimeRequests?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No pending overtime requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 