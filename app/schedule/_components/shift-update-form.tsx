'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from '@radix-ui/react-icons'
import { cn } from '@/app/lib/utils'
import { shiftSchema } from '@/app/lib/validations/shift'
import type { ShiftEvent, ShiftUpdateData } from '@/app/types/shift'
import { useShiftConflicts } from '@/lib/hooks'
import { toast } from '@/components/ui/use-toast'

interface ShiftUpdateFormProps {
  shift: ShiftEvent
  onUpdate: (shiftId: string, updateData: ShiftUpdateData) => Promise<void>
  onCancel: () => void
}

export function ShiftUpdateForm({ shift, onUpdate, onCancel }: ShiftUpdateFormProps) {
  const form = useForm({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      startTime: new Date(shift.start),
      endTime: new Date(shift.end),
      employeeId: shift.extendedProps.employeeId,
      shiftOptionId: shift.extendedProps.shiftOptionId,
    },
  })

  const { conflicts, isLoading: isCheckingConflicts } = useShiftConflicts({
    employeeId: form.watch('employeeId'),
    startTime: form.watch('startTime'),
    endTime: form.watch('endTime'),
    excludeShiftId: shift.id,
  })

  const onSubmit = async (data: ShiftUpdateData) => {
    try {
      if (conflicts && conflicts.length > 0) {
        toast({
          title: 'Schedule Conflict',
          description: 'This employee already has a shift scheduled during this time.',
          variant: 'destructive',
        })
        return
      }

      await onUpdate(shift.id, data)
      toast({
        title: 'Success',
        description: 'Shift updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update shift. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP HH:mm')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP HH:mm')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCheckingConflicts}
          >
            Update Shift
          </Button>
        </div>
      </form>
    </Form>
  )
} 