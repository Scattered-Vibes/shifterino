'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { differenceInHours, parse } from 'date-fns'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'

type ShiftOption = Database['public']['Tables']['shift_options']['Row']

const shiftOptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['early', 'day', 'swing', 'graveyard'], {
    required_error: 'Category is required',
  }),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:mm)',
  }),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:mm)',
  }),
})

type ShiftOptionFormValues = z.infer<typeof shiftOptionSchema>

interface EditShiftOptionDialogProps {
  option: ShiftOption | null
  onOpenChange: (open: boolean) => void
}

export function EditShiftOptionDialog({
  option,
  onOpenChange,
}: EditShiftOptionDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ShiftOptionFormValues>({
    resolver: zodResolver(shiftOptionSchema),
  })

  useEffect(() => {
    if (option) {
      form.reset({
        name: option.name,
        category: option.category,
        start_time: option.start_time,
        end_time: option.end_time,
      })
    }
  }, [form, option])

  async function onSubmit(data: ShiftOptionFormValues) {
    if (!option) return

    try {
      setIsPending(true)
      const supabase = createClient()

      // Calculate duration
      const startTime = parse(data.start_time, 'HH:mm', new Date())
      const endTime = parse(data.end_time, 'HH:mm', new Date())
      const duration = differenceInHours(endTime, startTime)

      if (duration <= 0) {
        form.setError('end_time', {
          type: 'manual',
          message: 'End time must be after start time',
        })
        return
      }

      // Check for overlapping shift options
      const { data: existing, error: checkError } = await supabase
        .from('shift_options')
        .select('*')
        .or(
          `and(start_time,lte,${data.end_time},end_time,gte,${data.start_time})`
        )
        .eq('category', data.category)
        .neq('id', option.id)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'A shift option already exists in this time range.',
          variant: 'destructive',
        })
        return
      }

      const { error: updateError } = await supabase
        .from('shift_options')
        .update({
          name: data.name,
          category: data.category,
          start_time: data.start_time,
          end_time: data.end_time,
          duration_hours: duration,
        })
        .eq('id', option.id)

      if (updateError) throw updateError

      toast({
        title: 'Success',
        description: 'Shift option updated successfully.',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating shift option:', error)
      toast({
        title: 'Error',
        description: 'Failed to update shift option. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={!!option} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Shift Option</DialogTitle>
          <DialogDescription>
            Modify the shift option details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Day Shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="early">Early</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="swing">Swing</SelectItem>
                      <SelectItem value="graveyard">Graveyard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 