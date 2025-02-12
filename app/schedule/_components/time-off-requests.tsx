'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TimeOffRequest } from '@/types/shift'
import { useToast } from '@/components/ui/use-toast'

interface TimeOffRequestsProps {
  requests: TimeOffRequest[]
  onSubmit: (request: Omit<TimeOffRequest, 'id' | 'status' | 'reviewedAt' | 'reviewedBy'>) => Promise<void>
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  isManager?: boolean
}

export function TimeOffRequests({
  requests,
  onSubmit,
  onApprove,
  onReject,
  isManager = false,
}: TimeOffRequestsProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSubmit({
        employeeId: '', // This should come from auth context
        startDate: date,
        endDate,
        reason,
      })
      toast({
        title: 'Success',
        description: 'Time off request submitted successfully',
      })
      setReason('')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit time off request',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Request Time Off</CardTitle>
          <CardDescription>
            Submit your time off request for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className="rounded-md border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for time off request"
              />
            </div>
            <Button type="submit">Submit Request</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Off Requests</CardTitle>
          <CardDescription>
            View and manage time off requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {format(request.startDate, 'PPP')} -{' '}
                    {format(request.endDate, 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.reason}
                  </p>
                  <p className="text-sm font-medium">
                    Status:{' '}
                    <span
                      className={
                        request.status === 'approved'
                          ? 'text-green-600'
                          : request.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }
                    >
                      {request.status}
                    </span>
                  </p>
                </div>
                {isManager && request.status === 'pending' && (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => onApprove?.(request.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onReject?.(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 