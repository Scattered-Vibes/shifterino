'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { toast } from 'sonner'

import type { TimeOffRequestWithDetails } from '@/types/models/time-off'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { approveTimeOffRequest, rejectTimeOffRequest } from '../actions/time-off'

interface TimeOffRequestsProps {
  requests: TimeOffRequestWithDetails[]
  onStatusUpdate?: () => void
}

function ApproveButton({ requestId }: { requestId: string }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      size="sm"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Approving...
        </>
      ) : (
        'Approve'
      )}
    </Button>
  )
}

function RejectButton({ requestId }: { requestId: string }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      variant="outline"
      size="sm"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rejecting...
        </>
      ) : (
        'Reject'
      )}
    </Button>
  )
}

export function TimeOffRequests({
  requests = [],
  onStatusUpdate,
}: TimeOffRequestsProps) {
  const [approveState, approveAction] = useFormState(async (prevState: any, formData: FormData) => {
    const requestId = formData.get('requestId') as string
    try {
      await approveTimeOffRequest(requestId)
      onStatusUpdate?.()
      return { success: true }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request')
      return { error: error.message }
    }
  }, null)

  const [rejectState, rejectAction] = useFormState(async (prevState: any, formData: FormData) => {
    const requestId = formData.get('requestId') as string
    try {
      await rejectTimeOffRequest(requestId, 'Request rejected')
      onStatusUpdate?.()
      return { success: true }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request')
      return { error: error.message }
    }
  }, null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!Array.isArray(requests)) {
    return <div>No requests available</div>
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">
          No time off requests to display.
        </p>
      ) : (
        requests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">
                    {request.employee?.first_name} {request.employee?.last_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(request.start_date)} -{' '}
                    {formatDate(request.end_date)}
                  </p>
                </div>
                <div className="space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <form action={rejectAction} className="inline-block">
                        <input type="hidden" name="requestId" value={request.id} />
                        <RejectButton requestId={request.id} />
                      </form>
                      <form action={approveAction} className="inline-block">
                        <input type="hidden" name="requestId" value={request.id} />
                        <ApproveButton requestId={request.id} />
                      </form>
                    </>
                  )}
                  {request.status !== 'pending' && (
                    <span
                      className={`text-sm ${
                        request.status === 'approved'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              {request.notes && <p className="text-sm">{request.notes}</p>}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
