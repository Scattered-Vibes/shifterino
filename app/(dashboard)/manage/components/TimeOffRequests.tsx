'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateTimeOffRequest } from '../actions/time-off'
import { toast } from '@/components/ui/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface TimeOffRequest {
  id: string
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

interface TimeOffRequestsProps {
  requests: TimeOffRequest[]
  onStatusUpdate?: () => void
}

export function TimeOffRequests() {
  const queryClient = useQueryClient()
  const { data: requests } = useQuery({
    queryKey: ['timeoff-requests'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('time_off_requests')
        .select('*')
        .order('created_at', { ascending: false })
      return data
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    setUpdatingId(requestId)
    try {
      await updateTimeOffRequest(requestId, status)
      toast({
        title: 'Success',
        description: `Request ${status} successfully`
      })
      queryClient.invalidateQueries(['timeoff-requests'])
    } catch (err) {
      console.error('Failed to update request status:', err)
      toast({
        title: 'Error',
        description: `Failed to ${status} request`,
        variant: 'destructive'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {requests?.length === 0 ? (
        <p className="text-sm text-gray-500">No time off requests to display.</p>
      ) : (
        requests.map(request => (
          <Card key={request.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">
                    {request.employee.first_name} {request.employee.last_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                </div>
                <div className="space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={updatingId === request.id}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={updatingId === request.id}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  {request.status !== 'pending' && (
                    <span className={`text-sm ${
                      request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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