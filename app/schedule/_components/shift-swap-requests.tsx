'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ShiftSwapRequest, ShiftEvent } from '@/types/shift'
import { useToast } from '@/components/ui/use-toast'

interface ShiftSwapRequestsProps {
  requests: ShiftSwapRequest[]
  availableShifts: ShiftEvent[]
  onSubmit: (request: Omit<ShiftSwapRequest, 'id' | 'status' | 'reviewedAt' | 'reviewedBy'>) => Promise<void>
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  isManager?: boolean
}

export function ShiftSwapRequests({
  requests,
  availableShifts,
  onSubmit,
  onApprove,
  onReject,
  isManager = false,
}: ShiftSwapRequestsProps) {
  const [selectedShift, setSelectedShift] = useState<string>('')
  const [targetShift, setTargetShift] = useState<string>('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShift) {
      toast({
        title: 'Error',
        description: 'Please select a shift to swap',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSubmit({
        requestingEmployeeId: '', // This should come from auth context
        requestedEmployeeId: '', // This should be determined by the target shift
        originalShiftId: selectedShift,
        targetShiftId: targetShift || undefined,
      })
      toast({
        title: 'Success',
        description: 'Shift swap request submitted successfully',
      })
      setSelectedShift('')
      setTargetShift('')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit shift swap request',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Request Shift Swap</CardTitle>
          <CardDescription>
            Submit your shift swap request for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Shift</Label>
              <Select
                value={selectedShift}
                onValueChange={setSelectedShift}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shift to swap" />
                </SelectTrigger>
                <SelectContent>
                  {availableShifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {format(shift.start, 'PPP p')} -{' '}
                      {format(shift.end, 'p')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Swap (Optional)</Label>
              <Select
                value={targetShift}
                onValueChange={setTargetShift}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a preferred shift" />
                </SelectTrigger>
                <SelectContent>
                  {availableShifts
                    .filter((shift) => shift.id !== selectedShift)
                    .map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {format(shift.start, 'PPP p')} -{' '}
                        {format(shift.end, 'p')}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Submit Request</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shift Swap Requests</CardTitle>
          <CardDescription>
            View and manage shift swap requests
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
                    Requesting Employee: {request.requestingEmployeeId}
                  </p>
                  {request.targetShiftId && (
                    <p className="text-sm text-muted-foreground">
                      Preferred Swap: {request.targetShiftId}
                    </p>
                  )}
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