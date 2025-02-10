'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { OvertimeDataTable } from './data-table'
import { OvertimeTableSkeleton } from './loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/ui/error-boundary'

async function getOvertimeRequests() {
  const supabase = createClient()

  const { data: requests, error } = await supabase
    .from('overtime_requests')
    .select(`
      *,
      employees (
        id,
        first_name,
        last_name,
        email,
        weekly_hours_cap,
        max_overtime_hours
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return requests || []
}

export default async function OvertimePage() {
  const supabase = createClient()

  try {
    // Verify authentication and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw handleError(authError)
    }

    if (!user) {
      redirect('/login')
    }

    // Fetch user role
    const { data: userRole } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (!userRole || !['MANAGER', 'SUPERVISOR'].includes(userRole.role)) {
      redirect('/unauthorized')
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Overtime Requests</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<OvertimeTableSkeleton />}>
                <OvertimeDataTable promise={getOvertimeRequests()} />
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