'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeOffDataTable } from './data-table'
import Loading from './loading'
import { CreateTimeOffButton } from './create-button'
import { TimeOffFilters } from './filters'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { requireAuth } from '@/lib/auth/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row']
}

async function getTimeOffRequests(employeeId: string, isManager: boolean): Promise<TimeOffRequest[]> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  let query = supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(*)
    `)
    .order('created_at', { ascending: false })

  if (!isManager) {
    // Only show user's own requests if not a manager
    query = query.eq('employee_id', employeeId)
  }

  const { data: requests, error } = await query

  if (error) throw error

  return (requests || []) as TimeOffRequest[]
}

export default async function TimeOffPage() {
  try {
    const user = await requireAuth()
    const isManager = user.role === 'manager' || user.role === 'supervisor'
  
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
                  promise={getTimeOffRequests(user.employeeId, isManager)} 
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
