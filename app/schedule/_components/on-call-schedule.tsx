'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OnCallSchedule } from '@/app/types/shift'
import { useToast } from '@/components/ui/use-toast'

interface OnCallScheduleProps {
  schedules: OnCallSchedule[]
  employees: Array<{ id: string; name: string }>
  onSubmit: (schedule: Omit<OnCallSchedule, 'id'>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isManager?: boolean
}

export function OnCallScheduleManager({
  schedules,
  employees,
  onSubmit,
  onDelete,
  isManager = false,
}: OnCallScheduleProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [priority, setPriority] = useState('1')
  const [notes, setNotes] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || !selectedEmployee) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSubmit({
        employeeId: selectedEmployee,
        startDate,
        endDate,
        priority: parseInt(priority),
        notes,
      })
      toast({
        title: 'Success',
        description: 'On-call schedule created successfully',
      })
      setNotes('')
      setSelectedEmployee('')
      setPriority('1')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create on-call schedule',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Create On-Call Schedule</CardTitle>
            <CardDescription>
              Schedule on-call coverage for employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="rounded-md border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primary</SelectItem>
                    <SelectItem value="2">Secondary</SelectItem>
                    <SelectItem value="3">Tertiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes"
                />
              </div>
              <Button type="submit">Create Schedule</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>On-Call Schedule</CardTitle>
          <CardDescription>
            View current on-call assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {employees.find((e) => e.id === schedule.employeeId)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(schedule.startDate, 'PPP')} -{' '}
                    {format(schedule.endDate, 'PPP')}
                  </p>
                  <p className="text-sm">
                    Priority: {schedule.priority === 1 ? 'Primary' : schedule.priority === 2 ? 'Secondary' : 'Tertiary'}
                  </p>
                  {schedule.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {schedule.notes}
                    </p>
                  )}
                </div>
                {isManager && onDelete && (
                  <Button
                    variant="outline"
                    onClick={() => onDelete(schedule.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 