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
import { createClient } from '@/lib/supabase/server'
import { EmployeesDataTable } from '@/components/employees/data-table'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CreateEmployeeButton } from '@/components/employees/create-button'
import type { Database } from '@/types/supabase/database'

type Employee = Database['public']['Tables']['employees']['Row']

async function getEmployees() {
  const supabase = await createClient()

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true }) as { data: Employee[] | null, error: Error | null }

  if (error) throw error
  return employees || []
}

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
}
