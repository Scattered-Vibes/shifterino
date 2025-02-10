'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
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
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon } from '@radix-ui/react-icons'

const scheduleFormSchema = z.object({
  start_date: z.date({
    required_error: 'A start date is required.',
  }),
  end_date: z.date({
    required_error: 'An end date is required.',
  }),
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

const defaultValues: Partial<ScheduleFormValues> = {
  start_date: new Date(),
  end_date: new Date(),
}

export function CreateScheduleButton() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ScheduleFormValues) {
    try {
      setIsPending(true)
      const supabase = createClient()

      // Validate date range
      if (data.end_date <= data.start_date) {
        form.setError('end_date', {
          type: 'manual',
          message: 'End date must be after start date',
        })
        return
      }

      // Check for overlapping schedule periods
      const { data: existing, error: checkError } = await supabase
        .from('schedule_periods')
        .select('*')
        .or(
          `and(start_date,lte,${format(
            data.end_date,
            'yyyy-MM-dd'
          )},end_date,gte,${format(data.start_date, 'yyyy-MM-dd')})`
        )

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'A schedule period already exists for this date range.',
          variant: 'destructive',
        })
        return
      }

      const { error: insertError } = await supabase.from('schedule_periods').insert({
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        status: 'draft',
      })

      if (insertError) throw insertError

      toast({
        title: 'Success',
        description: 'Schedule period created successfully.',
      })

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error creating schedule period:', error)
      toast({
        title: 'Error',
        description: 'Failed to create schedule period. Please try again.',
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
          Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Schedule Period</DialogTitle>
          <DialogDescription>
            Set the date range for a new schedule period.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date > form.getValues('end_date')
                    }
                    initialFocus
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < form.getValues('start_date')
                    }
                    initialFocus
                  />
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
                {isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 