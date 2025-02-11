'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { differenceInDays, format, parseISO } from 'date-fns'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/app/lib/supabase/client'
import { PlusIcon } from '@radix-ui/react-icons'

const timeOffSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

type TimeOffFormValues = z.infer<typeof timeOffSchema>

const defaultValues: Partial<TimeOffFormValues> = {
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
  reason: '',
  notes: '',
}

export function CreateTimeOffButton() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<TimeOffFormValues>({
    resolver: zodResolver(timeOffSchema),
    defaultValues,
  })

  async function onSubmit(data: TimeOffFormValues) {
    try {
      setIsPending(true)
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to submit a request.',
          variant: 'destructive',
        })
        return
      }

      // Get employee record
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (employeeError) throw employeeError
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee record not found.',
          variant: 'destructive',
        })
        return
      }

      // Calculate duration
      const startDate = parseISO(data.start_date)
      const endDate = parseISO(data.end_date)
      const duration = differenceInDays(endDate, startDate) + 1

      if (duration < 1) {
        form.setError('end_date', {
          type: 'manual',
          message: 'End date must be after start date',
        })
        return
      }

      // Submit request
      const { error: insertError } = await supabase.from('time_off_requests').insert({
        employee_id: employee.id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        notes: data.notes || null,
        status: 'pending',
      })

      if (insertError) throw insertError

      toast({
        title: 'Success',
        description: 'Time off request submitted successfully.',
      })

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
          <DialogDescription>
            Submit a new time off request for approval.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Vacation, sick leave, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details..."
                      className="h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 