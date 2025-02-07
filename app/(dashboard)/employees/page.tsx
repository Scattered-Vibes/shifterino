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

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']

export default async function EmployeesPage() {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch employee data
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*') as { data: Employee[] | null, error: Error | null }

  if (employeesError) {
    console.error('Error fetching employees:', employeesError)
    throw employeesError
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Employee Management</h1>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Shift Pattern
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {employees?.map((employee) => (
              <tr key={employee.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {employee.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {employee.shift_pattern}
                </td>
                <td className="whitespace-nowrap px-6 py-4">{employee.role}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
