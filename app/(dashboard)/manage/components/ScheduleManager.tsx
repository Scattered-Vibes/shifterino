'use client'

import { useCallback, useState } from 'react'
import type { Employee } from '@/types/database'
import { Card } from '@/components/ui/card'

interface ScheduleManagerProps {
  employees: Employee[]
}

export default function ScheduleManager({ employees }: ScheduleManagerProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])

  const handleEmployeeSelection = useCallback((employee: Employee) => {
    setSelectedEmployees(prev => 
      prev.some(e => e.id === employee.id)
        ? prev.filter(e => e.id !== employee.id)
        : [...prev, employee]
    )
  }, [])

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">Available Employees</h2>
        <div className="grid gap-4">
          {employees.map(employee => (
            <div 
              key={employee.id}
              className="p-4 border rounded-lg shadow-sm"
            >
              <p>{employee.first_name} {employee.last_name}</p>
              <button
                onClick={() => handleEmployeeSelection(employee)}
                className="text-blue-500 hover:text-blue-700"
              >
                {selectedEmployees.some(e => e.id === employee.id) ? 'Remove' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">Selected Employees</h2>
        <div className="grid gap-4">
          {selectedEmployees.map(employee => (
            <div 
              key={employee.id}
              className="p-4 border rounded-lg shadow-sm"
            >
              <p>{employee.first_name} {employee.last_name}</p>
              <button
                onClick={() => handleEmployeeSelection(employee)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 