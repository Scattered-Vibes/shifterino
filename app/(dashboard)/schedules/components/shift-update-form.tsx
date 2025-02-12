'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/index'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/client'

type IndividualShift = Tables['individual_shifts']['Row']

const formSchema = z.object({
  actualStartTime: z.date(),
  actualEndTime: z.date(),
  breakStartTime: z.date().optional(),
  breakEndTime: z.date().optional(),
  notes: z.string().optional(),
})

interface ShiftUpdateFormProps {
  shift: IndividualShift
}

export function ShiftUpdateForm({ shift }: ShiftUpdateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualStartTime: shift.actual_start_time ? new Date(shift.actual_start_time) : new Date(),
      actualEndTime: shift.actual_end_time ? new Date(shift.actual_end_time) : new Date(),
      breakStartTime: shift.break_start_time ? new Date(shift.break_start_time) : undefined,
      breakEndTime: shift.break_end_time ? new Date(shift.break_end_time) : undefined,
      notes: shift.notes || '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase
        .from('individual_shifts')
        .update({
          actual_start_time: data.actualStartTime.toISOString(),
          actual_end_time: data.actualEndTime.toISOString(),
          break_start_time: data.breakStartTime?.toISOString(),
          break_end_time: data.breakEndTime?.toISOString(),
          notes: data.notes,
          actual_hours_worked: calculateHoursWorked(
            data.actualStartTime,
            data.actualEndTime,
            data.breakStartTime,
            data.breakEndTime
          ),
        })
        .eq('id', shift.id)

      if (error) throw error

      toast({
        title: 'Shift updated',
        description: 'The shift has been updated successfully.',
      })

      router.refresh()
      router.push('/schedules')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update shift',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="actualStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Start Time</FormLabel>
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
            name="actualEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual End Time</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="breakStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break Start Time</FormLabel>
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
            name="breakEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break End Time</FormLabel>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Update Shift</Button>
      </form>
    </Form>
  )
}

function calculateHoursWorked(
  start: Date,
  end: Date,
  breakStart?: Date,
  breakEnd?: Date
): number {
  let totalMinutes = (end.getTime() - start.getTime()) / 1000 / 60

  if (breakStart && breakEnd) {
    const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60
    totalMinutes -= breakMinutes
  }

  return Math.round(totalMinutes / 60 * 100) / 100
} 