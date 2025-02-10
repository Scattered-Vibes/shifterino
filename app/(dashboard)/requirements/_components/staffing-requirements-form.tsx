'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { getStaffingRequirements, updateStaffingRequirements } from '../actions'
import type { StaffingRequirements } from '../actions'

// Schema for time period requirements
const timePeriodSchema = z.object({
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  minEmployees: z.number().min(1, 'Must have at least 1 employee'),
  minSupervisors: z.number().min(1, 'Must have at least 1 supervisor'),
})

// Schema for the entire form
const staffingRequirementsSchema = z.object({
  earlyMorning: timePeriodSchema,
  dayShift: timePeriodSchema,
  evening: timePeriodSchema,
  overnight: timePeriodSchema,
})

export function StaffingRequirementsForm() {
  const form = useForm<StaffingRequirements>({
    resolver: zodResolver(staffingRequirementsSchema),
  })

  // Load current requirements
  useEffect(() => {
    async function loadRequirements() {
      try {
        const requirements = await getStaffingRequirements()
        form.reset(requirements)
      } catch (error) {
        console.error('Failed to load staffing requirements:', error)
        toast.error('Failed to load staffing requirements')
      }
    }
    loadRequirements()
  }, [form])

  async function onSubmit(data: StaffingRequirements) {
    try {
      await updateStaffingRequirements(data)
      toast.success('Staffing requirements updated successfully')
    } catch (error) {
      console.error('Failed to update staffing requirements:', error)
      toast.error('Failed to update staffing requirements')
    }
  }

  const TimePeriodFields = ({ period }: { period: keyof StaffingRequirements }) => (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      <FormField
        control={form.control}
        name={`${period}.startTime`}
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
        name={`${period}.endTime`}
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
      <FormField
        control={form.control}
        name={`${period}.minEmployees`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Employees</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${period}.minSupervisors`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Supervisors</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Early Morning (5 AM - 9 AM)</CardTitle>
            <CardDescription>
              Set staffing requirements for the early morning period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodFields period="earlyMorning" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day Shift (9 AM - 9 PM)</CardTitle>
            <CardDescription>
              Set staffing requirements for the day shift period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodFields period="dayShift" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evening (9 PM - 1 AM)</CardTitle>
            <CardDescription>
              Set staffing requirements for the evening period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodFields period="evening" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overnight (1 AM - 5 AM)</CardTitle>
            <CardDescription>
              Set staffing requirements for the overnight period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePeriodFields period="overnight" />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Save Requirements
          </Button>
        </div>
      </form>
    </Form>
  )
} 