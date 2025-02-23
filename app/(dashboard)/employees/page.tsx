/**
 * EmployeesPage Component
 *
 * A server component that displays a table of all employees with their details.
 * Requires authentication and provides management capabilities for authorized users.
 *
 * Features:
 * - Verifies user authentication and redirects to login if not authenticated
 * - Fetches all employee data from Supabase
 * - Displays employee information in a sortable table format
 * - Provides actions for managing employee records (edit)
 * - Handles error states for data fetching
 *
 * @component
 * @example
 * ```tsx
 * <EmployeesPage />
 * ```
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerClient } from '@/lib/supabase/server'
import { EmployeesDataTable } from '@/components/employees/data-table'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CreateEmployeeButton } from '@/components/employees/create-button'
import type { Employee, EmployeeRow } from '@/types/models/employee'

function transformEmployee(row: EmployeeRow): Employee {
  if (!row.auth_id) {
    throw new Error(`Employee ${row.id} is missing auth_id`)
  }

  if (!row.employee_id) {
    throw new Error(`Employee ${row.id} is missing employee_id`)
  }

  return {
    id: row.id,
    auth_id: row.auth_id,
    email: row.email,
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    shift_pattern: row.shift_pattern,
    team_id: null,
    default_weekly_hours: row.weekly_hours_cap,
    weekly_hours_cap: row.weekly_hours_cap,
    max_overtime_hours: row.max_overtime_hours,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.created_at || new Date().toISOString(),
    created_by: null,
    updated_by: null,
    preferred_shift_category: row.preferred_shift_category,
    max_weekly_hours: row.weekly_hours_cap + row.max_overtime_hours,
    is_active: true
  }
}

async function getEmployees(): Promise<Employee[]> {
  const supabase = getServerClient()

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch employees: ${error.message}`)
  }

  if (!employees) {
    return []
  }

  // Transform and filter out any employees with missing required fields
  return employees
    .map(row => {
      try {
        return transformEmployee(row as EmployeeRow)
      } catch (error) {
        console.error('Error transforming employee:', error)
        return null
      }
    })
    .filter((employee): employee is Employee => employee !== null)
}

export default async function EmployeesPage() {
  const supabase = getServerClient()

  // Verify authentication
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  try {
    // Fetch employees data
    const employees = await getEmployees()

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <CreateEmployeeButton />
        </div>

        <ErrorBoundary>
          <Suspense fallback={<EmployeesDataTable data={[]} isLoading={true} />}>
            <EmployeesDataTable data={employees} isLoading={false} />
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  } catch (error) {
    console.error('Error in EmployeesPage:', error)
    throw error
  }
}
