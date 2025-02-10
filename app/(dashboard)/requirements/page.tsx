'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirementsDataTable } from './data-table'
import { RequirementsTableSkeleton } from './loading'
import { CreateRequirementButton } from './create-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { Database } from '@/types/database'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

async function getStaffingRequirements() {
  const supabase = createClient()

  const { data: requirements, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .order('time_block_start', { ascending: true })

  if (error) throw error
  return requirements || []
}

export default async function RequirementsPage() {
  const supabase = createClient()

  try {
    // Verify authentication and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) redirect('/login')

    // Get user's role
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) throw employeeError
    if (!employee || employee.role !== 'manager') {
      redirect('/unauthorized')
    }

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staffing Requirements</h1>
            <p className="text-muted-foreground">
              Manage minimum staffing requirements for different time blocks.
            </p>
          </div>
          <CreateRequirementButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<RequirementsTableSkeleton />}>
                <RequirementsDataTable promise={getStaffingRequirements()} />
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
