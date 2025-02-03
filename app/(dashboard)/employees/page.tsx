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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Employee interface defining the shape of employee data
 * @interface Employee
 * @property {string} id - Unique identifier for the employee
 * @property {string} first_name - Employee's first name
 * @property {string} last_name - Employee's last name
 * @property {string} email - Employee's email address
 * @property {boolean} is_supervisor - Whether the employee is a supervisor
 * @property {'pattern_a' | 'pattern_b'} shift_pattern - Employee's assigned shift pattern
 * @property {'employee' | 'manager' | 'supervisor'} role - Employee's role in the organization
 */
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_supervisor: boolean;
  shift_pattern: 'pattern_a' | 'pattern_b';
  role: 'employee' | 'manager' | 'supervisor';
}

export default async function EmployeesPage() {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Fetch employee data
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')
  
  if (employeesError) {
    console.error('Error fetching employees:', employeesError)
    throw employeesError
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift Pattern
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees?.map((employee: Employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.shift_pattern}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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