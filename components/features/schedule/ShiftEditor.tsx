'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import type { Schedule } from '@/types/scheduling/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils/index'
import { format, parseISO, setHours, setMinutes } from 'date-fns'

interface Employee {
  id: string
  name: string
  role: string
}

interface ShiftEditorProps {
  shift: Schedule
  employees: Employee[]
  onSave: (shift: Schedule) => Promise<void>
  onCancel: () => void
  className?: string
}

export function ShiftEditor({ shift, employees, onSave, onCancel, className }: ShiftEditorProps) {
  const shiftDate = parseISO(shift.date)
  const [date, setDate] = useState(format(shiftDate, 'yyyy-MM-dd'))
  const [time, setTime] = useState(format(shiftDate, 'HH:mm'))
  const [employeeId, setEmployeeId] = useState(shift.employeeId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    validateForm()
  }, [date, time, employeeId])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!date) {
      newErrors.date = 'Date is required'
    }

    if (!time) {
      newErrors.time = 'Time is required'
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      newErrors.time = 'Invalid time format'
    }

    if (!employeeId) {
      newErrors.employee = 'Employee is required'
    }

    setErrors(newErrors)
    setIsValid(Object.keys(newErrors).length === 0)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const shiftDateTime = setMinutes(setHours(parseISO(date), hours), minutes)
      
      await onSave({
        ...shift,
        date: shiftDateTime.toISOString(),
        employeeId
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedEmployee = employees.find(e => e.id === employeeId)

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          className={cn(errors.date && "border-destructive")}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="time">Time</Label>
        <Input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Time"
          className={cn(errors.time && "border-destructive")}
        />
        {errors.time && (
          <p className="text-sm text-destructive" role="alert">
            {errors.time}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="employee">Employee</Label>
        <Select
          value={employeeId}
          onValueChange={setEmployeeId}
        >
          <SelectTrigger 
            id="employee"
            className={cn(errors.employee && "border-destructive")}
          >
            <SelectValue placeholder="Select employee..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map(employee => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employee && (
          <p className="text-sm text-destructive">{errors.employee}</p>
        )}
      </div>

      {selectedEmployee && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            Role: {selectedEmployee.role}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

ShiftEditor.displayName = "ShiftEditor" 