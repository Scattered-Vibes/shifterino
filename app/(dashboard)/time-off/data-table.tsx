'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
}

interface DataTableProps {
  promise: Promise<TimeOffRequest[]>
  isManager: boolean
}

export async function TimeOffDataTable({ promise, isManager }: DataTableProps) {
  const requests = await promise
  return <DataTable requests={requests} isManager={isManager} />
}

function DataTable({ requests, isManager }: { requests: TimeOffRequest[], isManager: boolean }) {
  const router = useRouter()
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
  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    try {
      setIsPending(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('time_off_requests')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Request ${status} successfully.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating request:', error)
      toast({
        title: 'Error',
        description: 'Failed to update request. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  // Get status badge variant
  function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (status) {
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
            <TableHead>Notes</TableHead>
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
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {request.notes}
              </TableCell>
              {isManager && request.status === 'pending' && (
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
                        onClick={() => updateStatus(request.id, 'approved')}
                        className="text-green-600"
                      >
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus(request.id, 'rejected')}
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