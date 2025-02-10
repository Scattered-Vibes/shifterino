'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon } from '@radix-ui/react-icons'

const requirementFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  time_block_start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  time_block_end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  min_total_staff: z.coerce.number().min(1, 'Must be at least 1'),
  min_supervisors: z.coerce.number().min(1, 'Must be at least 1'),
  is_holiday: z.boolean().default(false),
})

type RequirementFormValues = z.infer<typeof requirementFormSchema>

const defaultValues: Partial<RequirementFormValues> = {
  name: '',
  time_block_start: '',
  time_block_end: '',
  min_total_staff: 1,
  min_supervisors: 1,
  is_holiday: false,
}

export function CreateRequirementButton() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues,
  })

  async function onSubmit(data: RequirementFormValues) {
    try {
      setIsPending(true)
      const supabase = createClient()

      // Validate time block
      const start = new Date(`1970-01-01T${data.time_block_start}`)
      const end = new Date(`1970-01-01T${data.time_block_end}`)
      
      if (end <= start) {
        form.setError('time_block_end', {
          type: 'manual',
          message: 'End time must be after start time',
        })
        return
      }

      // Check for overlapping time blocks
      const { data: existing, error: checkError } = await supabase
        .from('staffing_requirements')
        .select('*')
        .or(`time_block_start,eq,${data.time_block_start},time_block_end,eq,${data.time_block_end}`)
        .is('schedule_period_id', null)
        .eq('is_holiday', data.is_holiday)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'A requirement for this time block already exists.',
          variant: 'destructive',
        })
        return
      }

      const { error: insertError } = await supabase
        .from('staffing_requirements')
        .insert({
          name: data.name,
          time_block_start: data.time_block_start,
          time_block_end: data.time_block_end,
          min_total_staff: data.min_total_staff,
          min_supervisors: data.min_supervisors,
          is_holiday: data.is_holiday,
        })

      if (insertError) throw insertError

      toast({
        title: 'Success',
        description: 'Staffing requirement created successfully.',
      })

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error creating requirement:', error)
      toast({
        title: 'Error',
        description: 'Failed to create requirement. Please try again.',
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
          Add Requirement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Requirement</DialogTitle>
          <DialogDescription>
            Add a new staffing requirement for a specific time block.
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
                    <Input
                      placeholder="Early Morning Block"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_block_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09:00"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time_block_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="17:00"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_total_staff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Staff</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_supervisors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Supervisors</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_holiday"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Holiday Requirement
                    </FormLabel>
                    <FormDescription>
                      This requirement only applies on holidays
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
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