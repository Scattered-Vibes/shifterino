'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ShiftEvent } from '@/types/shift'
import { SHIFT_PATTERNS } from '@/lib/utils/shift-patterns'

const shiftFormSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  employeeRole: z.enum(['dispatcher', 'supervisor', 'manager']),
  title: z.string().min(1, 'Title is required'),
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
  pattern: z.enum(['PATTERN_A', 'PATTERN_B']),
  overrideHoursCap: z.boolean().default(false),
  notes: z.string().optional(),
})

type ShiftFormValues = z.infer<typeof shiftFormSchema>

interface ShiftUpdateFormProps {
  shift: Partial<ShiftEvent>
  onSubmit: (shiftId: string, data: Partial<ShiftEvent>) => Promise<void>
  onCancel: () => void
  employees: Array<{ id: string; name: string; role: string }>
}

export function ShiftUpdateForm({
  shift,
  onSubmit,
  onCancel,
  employees,
}: ShiftUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      employeeId: shift.employeeId || '',
      employeeRole: shift.employeeRole || 'dispatcher',
      title: shift.title || '',
      start: shift.start ? format(new Date(shift.start), "yyyy-MM-dd'T'HH:mm") : '',
      end: shift.end ? format(new Date(shift.end), "yyyy-MM-dd'T'HH:mm") : '',
      pattern: 'PATTERN_A',
      overrideHoursCap: shift.overrideHoursCap || false,
      notes: shift.notes || '',
    },
  })

  const handleSubmit = async (data: ShiftFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(shift.id || 'new', {
        ...data,
        start: new Date(data.start).toISOString(),
        end: new Date(data.end).toISOString(),
      })
    } catch (error) {
      console.error('Error submitting shift:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Shift title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift Pattern</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PATTERN_A">
                      Pattern A (4x10)
                    </SelectItem>
                    <SelectItem value="PATTERN_B">
                      Pattern B (3x12 + 1x4)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="overrideHoursCap"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Override Hours Cap</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Allow exceeding 40 hours per week
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
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
                  <Textarea
                    placeholder="Add any additional notes..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Shift'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
} 