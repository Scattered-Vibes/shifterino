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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { scheduleSchema, type ScheduleFormData } from '@/lib/validations/schemas'

interface ScheduleFormProps {
  initialData?: Partial<ScheduleFormData>
  onSubmit: (data: ScheduleFormData) => Promise<void>
  isLoading?: boolean
}

export const ScheduleForm: FC<ScheduleFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      employee_id: initialData?.employee_id || '',
      shift_pattern: {
        pattern_type: initialData?.shift_pattern?.pattern_type || 'four_ten',
        start_day: initialData?.shift_pattern?.start_day || 0,
        preferred_shift: initialData?.shift_pattern?.preferred_shift || 'day'
      },
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      is_supervisor: initialData?.is_supervisor || false,
      status: initialData?.status || 'draft'
    }
  })

  const handleSubmit = async (data: ScheduleFormData) => {
    try {
      await onSubmit(data)
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
        variant: 'default'
      })
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update schedule',
        variant: 'destructive'
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          name="shift_pattern.pattern_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shift Pattern</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift pattern" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="four_ten">4x10 Hours</SelectItem>
                  <SelectItem value="three_twelve_plus_four">3x12 + 4 Hours</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose between four 10-hour shifts or three 12-hour shifts plus one 4-hour shift
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shift_pattern.start_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Day</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shift_pattern.preferred_shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Shift</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred shift" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                />
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
                <Input
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Schedule duration cannot exceed 4 months
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_supervisor"
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
                  Supervisor Schedule
                </FormLabel>
                <FormDescription>
                  Mark this schedule as a supervisor schedule
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </form>
    </Form>
  )
} 