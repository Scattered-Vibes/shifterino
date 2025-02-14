import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeOffDataTable } from './data-table'
import Loading from './loading'
import { CreateTimeOffButton } from './create-button'
import { TimeOffFilters } from './filters'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { Database } from '@/types/supabase/database'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
}

async function getTimeOffRequests(userId: string, isManager: boolean) {
  const supabase = createClient()

  const query = supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(*)
    `)
    .order('created_at', { ascending: false })

  // If not a manager, only show user's requests
  if (!isManager) {
    query.eq('employee_id', userId)
  }

  const { data: requests, error } = await query

  if (error) throw error
  return requests as TimeOffRequest[]
}

export default async function TimeOffPage() {
  const supabase = createClient()

  try {
    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) redirect('/login')

    // Get user's role and ID
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) throw employeeError
    if (!employee) redirect('/unauthorized')

    const isManager = ['manager', 'supervisor'].includes(employee.role)

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Time Off Requests</h1>
            <p className="text-muted-foreground">
              {isManager 
                ? 'Manage time off requests for all employees.' 
                : 'View and manage your time off requests.'}
            </p>
          </div>
          <CreateTimeOffButton />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isManager ? 'All Requests' : 'Your Requests'}
              </CardTitle>
              <TimeOffFilters />
            </div>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <TimeOffDataTable 
                  promise={getTimeOffRequests(employee.id, isManager)} 
                  isManager={isManager}
                />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    throw handleError(error)
  }
}
