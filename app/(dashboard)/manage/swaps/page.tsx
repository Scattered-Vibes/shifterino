'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useSwapRequestSubscription } from '@/app/hooks/useRealtimeSubscription'
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
import { format } from 'date-fns'
import { Database } from '@/types/supabase/database'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

type Tables = Database['public']['Tables']
type ShiftSwapRequest = Tables['shift_swap_requests']['Row']
type Employee = Tables['employees']['Row']
type IndividualShift = Tables['individual_shifts']['Row']
type ShiftOption = Tables['shift_options']['Row']

type SwapRequest = Omit<ShiftSwapRequest, 'requesting_employee_id' | 'target_employee_id' | 'requesting_shift_id' | 'target_shift_id'> & {
  requesting_employee: Pick<Employee, 'id' | 'first_name' | 'last_name'>
  target_employee: Pick<Employee, 'id' | 'first_name' | 'last_name'>
  requesting_shift: IndividualShift & {
    shift_options: Pick<ShiftOption, 'id' | 'start_time' | 'end_time'>
  }
  target_shift: IndividualShift & {
    shift_options: Pick<ShiftOption, 'id' | 'start_time' | 'end_time'>
  }
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  actionText: string
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, actionText }: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{actionText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function ShiftSwapsPage() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    requestId: string
    approve: boolean
  }>({
    isOpen: false,
    requestId: '',
    approve: false
  })

  // Fetch pending swap requests
  const { data: swapRequests, isLoading, error } = useQuery<SwapRequest[]>({
    queryKey: ['swapRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .select(`
          id,
          status,
          reason,
          requested_at,
          reviewed_by,
          reviewed_at,
          requesting_employee:employees!requesting_employee_id (
            id,
            first_name,
            last_name
          ),
          target_employee:employees!target_employee_id (
            id,
            first_name,
            last_name
          ),
          requesting_shift:individual_shifts!requesting_shift_id (
            id,
            date,
            shift_options (
              id,
              start_time,
              end_time
            )
          ),
          target_shift:individual_shifts!target_shift_id (
            id,
            date,
            shift_options (
              id,
              start_time,
              end_time
            )
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })

      if (error) throw error
      return data as unknown as SwapRequest[]
    }
  })

  // Subscribe to real-time updates
  useSwapRequestSubscription({
    queryKey: ['swapRequests']
  })

  // Review swap request mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) => {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_by: 'current-user-id', // TODO: Get actual user ID
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // If approved, swap the shifts
      if (approve) {
        const request = swapRequests?.find(r => r.id === requestId)
        if (!request) throw new Error('Request not found')

        // Call the stored procedure to swap shifts
        const { error: swapError } = await supabase.rpc('swap_shifts', {
          requesting_shift_id: request.requesting_shift.id,
          target_shift_id: request.target_shift.id
        })

        if (swapError) throw swapError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
      toast({
        title: variables.approve ? 'Swap Request Approved' : 'Swap Request Rejected',
        description: `The swap request has been ${variables.approve ? 'approved' : 'rejected'} successfully.`
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while processing the request.',
        variant: 'destructive'
      })
    }
  })

  const handleReview = (requestId: string, approve: boolean) => {
    setConfirmDialog({
      isOpen: true,
      requestId,
      approve
    })
  }

  const handleConfirm = () => {
    reviewMutation.mutate({
      requestId: confirmDialog.requestId,
      approve: confirmDialog.approve
    })
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading swap requests: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Swap Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requesting Employee</TableHead>
                  <TableHead>Current Shift</TableHead>
                  <TableHead>Target Employee</TableHead>
                  <TableHead>Target Shift</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {swapRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.requesting_employee.first_name} {request.requesting_employee.last_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.requesting_shift.date), 'MMM d')}
                      <br />
                      {format(new Date(`2000-01-01T${request.requesting_shift.shift_options.start_time}`), 'h:mm a')} -{' '}
                      {format(new Date(`2000-01-01T${request.requesting_shift.shift_options.end_time}`), 'h:mm a')}
                    </TableCell>
                    <TableCell>
                      {request.target_employee?.first_name} {request.target_employee?.last_name}
                    </TableCell>
                    <TableCell>
                      {request.target_shift ? (
                        <>
                          {format(new Date(request.target_shift.date), 'MMM d')}
                          <br />
                          {format(new Date(`2000-01-01T${request.target_shift.shift_options.start_time}`), 'h:mm a')} -{' '}
                          {format(new Date(`2000-01-01T${request.target_shift.shift_options.end_time}`), 'h:mm a')}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Open Shift</span>
                      )}
                    </TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReview(request.id, true)}
                          disabled={reviewMutation.isPending}
                        >
                          {reviewMutation.isPending && reviewMutation.variables?.requestId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(request.id, false)}
                          disabled={reviewMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!swapRequests || swapRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No pending swap requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirm}
        title={confirmDialog.approve ? 'Approve Swap Request' : 'Reject Swap Request'}
        description={`Are you sure you want to ${confirmDialog.approve ? 'approve' : 'reject'} this swap request?`}
        actionText={confirmDialog.approve ? 'Approve' : 'Reject'}
      />
    </div>
  )
} 