'use client'

import { format } from 'date-fns'
import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/ui/form-dialog'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { handleClientError } from '@/lib/utils/error-handler'
import { timeOffSchema, submitTimeOff, type TimeOffFormValues } from './actions'

const defaultValues: TimeOffFormValues = {
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
  reason: '',
  notes: '',
}

export function CreateTimeOffButton() {
  const { toast } = useToast()

  async function onSubmit(values: TimeOffFormValues) {
    try {
      await submitTimeOff(values)
      toast({
        title: 'Success',
        description: 'Time off request submitted successfully.',
      })
    } catch (error) {
      handleClientError(error, toast, 'Failed to submit time off request')
      throw error // Re-throw to keep dialog open
    }
  }

  return (
    <FormDialog
      trigger={
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      }
      title="Request Time Off"
      description="Submit a new time off request for approval."
      schema={timeOffSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField
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
    </FormDialog>
  )
} 