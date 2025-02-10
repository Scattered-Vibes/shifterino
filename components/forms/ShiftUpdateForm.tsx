'use client'

import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { shiftUpdateFormSchema, type ShiftFormData } from '@/lib/validations/schemas'

interface ShiftUpdateFormProps {
  initialData?: Partial<ShiftFormData>
  onSubmit: (data: ShiftFormData) => Promise<void>
  isLoading?: boolean
}

export const ShiftUpdateForm: FC<ShiftUpdateFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftUpdateFormSchema),
    defaultValues: {
      start_time: initialData?.start_time || new Date(),
      end_time: initialData?.end_time || new Date(),
      employee_id: initialData?.employee_id || '',
      is_supervisor_shift: initialData?.is_supervisor_shift || false,
      notes: initialData?.notes || ''
    }
  })

  const handleSubmit = async (data: ShiftFormData) => {
    try {
      await onSubmit(data)
      toast({
        title: 'Success',
        description: 'Shift updated successfully',
        variant: 'default'
      })
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update shift',
        variant: 'destructive'
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Shift duration must be between 4 and 12 hours
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_supervisor_shift"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Supervisor Shift
                </FormLabel>
                <FormDescription>
                  Mark this shift as requiring a supervisor
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Optional notes about this shift
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Shift'}
        </Button>
      </form>
    </Form>
  )
} 