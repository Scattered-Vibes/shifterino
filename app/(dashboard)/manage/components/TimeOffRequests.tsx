'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { TimeOffRequest } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

/**
 * Props for the TimeOffRequests component.
 */
interface TimeOffRequestsProps {
  requests: Array<TimeOffRequest & {
    employee: {
      first_name: string
      last_name: string
    }
  }>
}

/**
 * TimeOffRequests component displays a list of time-off requests in a table.
 * It allows the user to view detailed information about each request and take action
 * to either approve or reject the request.
 *
 * @param {TimeOffRequestsProps} props - The component props.
 * @returns {JSX.Element} A table of time-off requests with action dialogs.
 */
export default function TimeOffRequests({ requests }: TimeOffRequestsProps) {
  // Local state for managing the currently selected time off request.
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null)

  // Initialize Supabase client for database operations.
  const supabase = createClient()

  /**
   * Approve a time-off request.
   * Updates the request status to 'approved' in the database and reloads the page upon success.
   *
   * @param {TimeOffRequest} request - The time-off request object to approve.
   */
  const handleApprove = async (request: TimeOffRequest) => {
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status: 'approved' })
      .eq('id', request.id)

    if (!error) {
      // Reload the page to show updated data.
      window.location.reload()
    }
  }

  /**
   * Reject a time-off request.
   * Updates the request status to 'rejected' in the database and reloads the page upon success.
   *
   * @param {TimeOffRequest} request - The time-off request object to reject.
   */
  const handleReject = async (request: TimeOffRequest) => {
    const { error } = await supabase
      .from('time_off_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id)

    if (!error) {
      // Reload the page to show updated data.
      window.location.reload()
    }
  }

  return (
    <div>
      {/* Table displaying the time-off requests */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <TableRow key={request.id}>
              <TableCell>
                {request.employee.first_name} {request.employee.last_name}
              </TableCell>
              <TableCell>
                {new Date(request.start_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(request.end_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Time-Off Request Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Display employee name */}
                        <div>
                          <h4 className="font-medium">Employee</h4>
                          <p>
                            {request.employee.first_name} {request.employee.last_name}
                          </p>
                        </div>
                        {/* Display requested dates */}
                        <div>
                          <h4 className="font-medium">Dates</h4>
                          <p>
                            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        {/* If a reason was provided, display it */}
                        {request.reason && (
                          <div>
                            <h4 className="font-medium">Reason</h4>
                            <p>{request.reason}</p>
                          </div>
                        )}
                        {/* Action buttons for rejecting or approving the request */}
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handleReject(request)}
                          >
                            Reject
                          </Button>
                          <Button onClick={() => handleApprove(request)}>
                            Approve
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}