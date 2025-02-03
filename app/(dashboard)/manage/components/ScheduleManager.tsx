'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Employee, Schedule } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

/**
 * Props for the ScheduleManager component.
 */
interface ScheduleManagerProps {
  currentSchedule: Array<Schedule & {
    employee: {
      first_name: string
      last_name: string
      is_supervisor: boolean
    }
  }>
  employees: Employee[]
}

/**
 * ScheduleManager Component
 *
 * This client-side component provides an interface to manage employee schedules.
 * It displays a calendar for selecting a date, a table of shifts for the selected date,
 * and a dialog to add new shifts to the schedule.
 *
 * @param {ScheduleManagerProps} props - Component properties including current schedules and employee list.
 * @returns React element representing the schedule management UI.
 */
export default function ScheduleManager({ currentSchedule, employees }: ScheduleManagerProps) {
  // State to hold the currently selected date (default is today's date).
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  // State to control the visibility of the "Add Shift" dialog.
  const [showAddShift, setShowAddShift] = useState(false)
  // State to hold the selected employee ID for a new shift.
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  // State to hold the selected shift type.
  const [selectedShiftType, setSelectedShiftType] = useState<string>('')

  // Initialize Supabase client for database operations.
  const supabase = createClient()

  /**
   * Handles the addition of a new shift.
   *
   * Validates that a date, employee, and shift type are selected.
   * Determines shift start and end times based on the selected shift type,
   * then inserts the new shift into the schedules database.
   * If the insertion is successful, it closes the dialog and reloads the page.
   */
  const handleAddShift = async () => {
    if (!selectedDate || !selectedEmployee || !selectedShiftType) return

    // Determine shift times based on shift type.
    let startTime, endTime
    switch (selectedShiftType) {
      case 'day_early':
        startTime = '05:00'
        endTime = '15:00'
        break
      case 'day':
        startTime = '09:00'
        endTime = '19:00'
        break
      case 'swing':
        startTime = '15:00'
        endTime = '01:00'
        break
      case 'graveyard':
        startTime = '21:00'
        endTime = '07:00'
        break
      default:
        return
    }

    // Insert the new shift into the database.
    const { error } = await supabase
      .from('schedules')
      .insert({
        employee_id: selectedEmployee,
        shift_date: selectedDate.toISOString().split('T')[0],
        shift_type: selectedShiftType,
        start_time: startTime,
        end_time: endTime,
        is_supervisor_shift: employees.find(e => e.id === selectedEmployee)?.is_supervisor || false
      })

    // Close the dialog and reload the page if no errors occurred.
    if (!error) {
      setShowAddShift(false)
      window.location.reload()
    }
  }

  // Filter shifts to include only those that match the selected date.
  const shiftsForDate = selectedDate
    ? currentSchedule.filter(s => 
        new Date(s.shift_date).toDateString() === selectedDate.toDateString()
      )
    : []

  return (
    <div className="space-y-6">
      <div className="flex space-x-6">
        <div className="w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">
              Shifts for {selectedDate?.toLocaleDateString()}
            </h3>
            <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
              <DialogTrigger asChild>
                <Button>Add Shift</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Employee</label>
                    <Select
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name}
                            {employee.is_supervisor ? ' (Supervisor)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Shift Type</label>
                    <Select
                      value={selectedShiftType}
                      onValueChange={setSelectedShiftType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day_early">Early Day (5AM-3PM)</SelectItem>
                        <SelectItem value="day">Day (9AM-7PM)</SelectItem>
                        <SelectItem value="swing">Swing (3PM-1AM)</SelectItem>
                        <SelectItem value="graveyard">Graveyard (9PM-5AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddShift}>
                      Add Shift
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Shift Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Supervisor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shiftsForDate.map(shift => (
                <TableRow key={shift.id}>
                  <TableCell>
                    {shift.employee.first_name} {shift.employee.last_name}
                  </TableCell>
                  <TableCell className="capitalize">
                    {shift.shift_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    {shift.start_time}-{shift.end_time}
                  </TableCell>
                  <TableCell>
                    {shift.employee.is_supervisor ? 'Yes' : 'No'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 