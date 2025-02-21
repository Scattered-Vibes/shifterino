'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  DotsHorizontalIcon,
  CheckIcon,
  CrossCircledIcon,
} from '@radix-ui/react-icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { handleClientError } from '@/lib/utils/error-handler'
import { updateTimeOffStatus } from './actions'
import type { Database } from '@/types/supabase/database'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
}

type TimeOffStatus = TimeOffRequest['status']

export function TimeOffDataTable({ promise, isManager }: { promise: Promise<TimeOffRequest[]>, isManager: boolean }) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([])

  useEffect(() => {
    promise.then((data) => setRequests(data))
  }, [promise])

  return <DataTable requests={requests} isManager={isManager} />
}

function DataTable({ requests, isManager }: { requests: TimeOffRequest[], isManager: boolean }) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)

  // Filter requests based on URL params
  const filteredRequests = requests.filter((request) => {
    const status = searchParams?.get('status')
    const date = searchParams?.get('date')

    if (status && request.status !== status) {
      return false
    }

    if (date) {
      const requestDate = parseISO(request.start_date)
      const filterDate = parseISO(date)
      if (
        requestDate.getFullYear() !== filterDate.getFullYear() ||
        requestDate.getMonth() !== filterDate.getMonth() ||
        requestDate.getDate() !== filterDate.getDate()
      ) {
        return false
      }
    }

    return true
  })

  // Handle request status update
  async function handleStatusUpdate(id: string, status: 'approved' | 'rejected') {
    try {
      setIsPending(true)
      await updateTimeOffStatus(id, status)
      toast({
        title: 'Success',
        description: `Request ${status} successfully.`,
      })
    } catch (error) {
      await handleClientError(
        () => Promise.reject(error),
        toast,
        { defaultMessage: 'Failed to update request status' }
      )
    } finally {
      setIsPending(false)
    }
  }

  // Get status badge variant
  function getStatusVariant(status: TimeOffStatus): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">No requests found</p>
          <p className="text-sm text-muted-foreground">
            {searchParams?.toString()
              ? 'Try changing your filters'
              : 'Create a new request to get started'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            {isManager && <TableHead>Employee</TableHead>}
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            {isManager && <TableHead className="w-[100px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id}>
              {isManager && (
                <TableCell>
                  {request.employee.first_name} {request.employee.last_name}
                </TableCell>
              )}
              <TableCell>{format(parseISO(request.start_date), 'PPP')}</TableCell>
              <TableCell>{format(parseISO(request.end_date), 'PPP')}</TableCell>
              <TableCell>
                {differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1} days
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(request.status)} className="capitalize">
                  {request.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {request.reason}
              </TableCell>
              {isManager && request.status.toLowerCase() === 'pending' && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <DotsHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="text-green-600"
                      >
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="text-destructive"
                      >
                        <CrossCircledIcon className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 