'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import type { TimeOffRequest } from '@/types/time-off'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { updateTimeOffRequest } from '../actions/time-off'

interface TimeOffRequestsProps {
  requests: TimeOffRequest[]
  onStatusUpdate?: () => void
}

export function TimeOffRequests({
  requests = [],
  onStatusUpdate,
}: TimeOffRequestsProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusUpdate = async (
    requestId: string,
    status: 'approved' | 'rejected'
  ) => {
    setUpdatingId(requestId)
    try {
      await updateTimeOffRequest(requestId, status)
      toast.success(`Request ${status} successfully`)
      onStatusUpdate?.()
    } catch (err) {
      console.error('Failed to update request status:', err)
      toast.error(`Failed to ${status} request`)
    } finally {
      setUpdatingId(null)
    }
  }

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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusUpdate(request.id, 'rejected')
                        }
                        disabled={updatingId === request.id}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusUpdate(request.id, 'approved')
                        }
                        disabled={updatingId === request.id}
                      >
                        Approve
                      </Button>
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
              <p className="text-sm">{request.reason}</p>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
