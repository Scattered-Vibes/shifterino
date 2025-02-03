'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { Employee, EmployeeRole, ShiftPattern } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

/**
 * Props for the StaffList component.
 *
 * @interface StaffListProps
 * @property {Employee[]} employees - An array of employee records.
 */
interface StaffListProps {
  employees: Employee[]
}

/**
 * StaffList component renders a list of employees in a table and provides a dialog to add a new employee.
 *
 * @param {StaffListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export default function StaffList({ employees }: StaffListProps) {
  // State to control the visibility of the "Add Employee" dialog.
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  // State holding the new employee data that will be inserted into the database.
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'dispatcher' as EmployeeRole,
    shift_pattern: 'pattern_a' as ShiftPattern,
    weekly_hours_cap: 40
  })

  // Create a Supabase client instance to interact with the database.
  const supabase = createClient()

  /**
   * Handles the addition of a new employee.
   * 
   * Inserts the new employee data into the 'employees' table. If the insertion is successful,
   * the "Add Employee" dialog is closed and the page is reloaded to reflect the changes.
   */
  const handleAddEmployee = async () => {
    const { error } = await supabase
      .from('employees')
      .insert(newEmployee)

    if (!error) {
      setShowAddEmployee(false)
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section with title and button to open the add employee dialog */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Staff List</h3>
        <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
          <DialogTrigger asChild>
            <Button>Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Input for first name */}
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={newEmployee.first_name}
                  onChange={e => setNewEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              {/* Input for last name */}
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={newEmployee.last_name}
                  onChange={e => setNewEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              {/* Input for email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={e => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              {/* Select for shift pattern */}
              <div>
                <label className="text-sm font-medium">Shift Pattern</label>
                <Select
                  value={newEmployee.shift_pattern}
                  onValueChange={value => setNewEmployee(prev => ({ ...prev, shift_pattern: value as 'pattern_a' | 'pattern_b' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
                    <SelectItem value="pattern_b">Pattern B (3x12 + 4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Select for employee role */}
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={newEmployee.role}
                  onValueChange={value => setNewEmployee(prev => ({ ...prev, role: value as EmployeeRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Button to trigger adding an employee */}
              <div className="flex justify-end">
                <Button onClick={handleAddEmployee}>
                  Add Employee
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table displaying the list of employees */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Shift Pattern</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map(employee => (
            <TableRow key={employee.id}>
              <TableCell>
                {employee.first_name} {employee.last_name}
              </TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell className="capitalize">
                {employee.role}
              </TableCell>
              <TableCell>
                {employee.shift_pattern === 'pattern_a' ? 'Pattern A (4x10)' : 'Pattern B (3x12 + 4)'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 