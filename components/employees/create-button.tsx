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
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Database } from '@/types/supabase/database'
import type { PostgrestError } from '@supabase/supabase-js'

type EmployeeRole = Database['public']['Enums']['employee_role']
type ShiftPatternType = Database['public']['Enums']['shift_pattern_type']
type ShiftCategory = Database['public']['Enums']['shift_category']

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
  employee_id: z.string().min(1, {
    message: 'Employee ID is required.',
  }),
  role: z.enum(['dispatcher', 'supervisor', 'manager'] as const),
  shift_pattern: z.enum(['4x10', '3x12_plus_4'] as const),
  preferred_shift_category: z.enum(['early', 'day', 'swing', 'graveyard'] as const),
  weekly_hours_cap: z.coerce.number().int().min(0).max(60),
  max_overtime_hours: z.coerce.number().int().min(0).max(20),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

const defaultValues: EmployeeFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  employee_id: '',
  role: 'dispatcher',
  shift_pattern: '4x10',
  preferred_shift_category: 'day',
  weekly_hours_cap: 40,
  max_overtime_hours: 0,
}

export function CreateEmployeeButton() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  async function onSubmit(data: EmployeeFormValues) {
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      const supabase = createClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { error } = await supabase
        .from('employees')
        .insert({
          ...data,
          auth_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Employee created successfully.',
      })
      
      setOpen(false)
      form.reset(defaultValues)
      router.refresh()
    } catch (err: unknown) {
      console.error('Error creating employee:', err)
      let message = 'Failed to create employee. Please try again.'
      
      if (err instanceof Error) {
        message = err.message
      } else if ((err as PostgrestError)?.message) {
        message = (err as PostgrestError).message
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        form.reset(defaultValues)
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new employee record. Click save when you&apos;re done.
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shift pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4x10">
                        4x10 (Four 10-hour shifts)
                      </SelectItem>
                      <SelectItem value="3x12_plus_4">
                        3x12+4 (Three 12-hour shifts plus one 4-hour shift)
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                        field.onChange(value)
                      }}
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
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                        field.onChange(value)
                      }}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 