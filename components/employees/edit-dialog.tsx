'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/app/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Pencil2Icon } from '@radix-ui/react-icons'
import type { Database } from '@/app/types/supabase/database'
type Employee = Database['public']['Tables']['employees']['Row']

const employeeFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  role: z.enum(['dispatcher', 'supervisor', 'manager']),
  shift_pattern: z.enum(['pattern_a', 'pattern_b', 'custom']),
  preferred_shift_category: z.enum(['early', 'day', 'swing', 'graveyard']).optional(),
  weekly_hours_cap: z.number().min(0).max(60),
  max_overtime_hours: z.number().min(0).max(20).optional(),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

interface EditEmployeeDialogProps {
  employee: Employee
}

export function EditEmployeeDialog({ employee }: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      shift_pattern: employee.shift_pattern,
      preferred_shift_category: employee.preferred_shift_category || undefined,
      weekly_hours_cap: employee.weekly_hours_cap,
      max_overtime_hours: employee.max_overtime_hours || undefined,
    },
  })

  async function onSubmit(data: EmployeeFormValues) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('employees')
        .update({
          ...data,
          preferred_shift_category: data.preferred_shift_category || null,
          max_overtime_hours: data.max_overtime_hours || null,
        })
        .eq('id', employee.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Employee updated successfully.',
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
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
              name="shift_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Pattern</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shift pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pattern_a">
                        Pattern A (4x10)
                      </SelectItem>
                      <SelectItem value="pattern_b">
                        Pattern B (3x12 + 1x4)
                      </SelectItem>
                      <SelectItem value="custom">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferred_shift_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Shift Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred shift" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="early">Early (5AM-3PM)</SelectItem>
                      <SelectItem value="day">Day (9AM-7PM)</SelectItem>
                      <SelectItem value="swing">Swing (3PM-1AM)</SelectItem>
                      <SelectItem value="graveyard">
                        Graveyard (9PM-7AM)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weekly_hours_cap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Hours Cap</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_overtime_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Overtime Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 