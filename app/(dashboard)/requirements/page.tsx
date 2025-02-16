import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AppError, ErrorCode, handleError } from '@/lib/utils/error-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirementsDataTable } from './data-table'
import RequirementsLoading from './loading'
import { CreateRequirementButton } from './create-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { Database } from '@/types/supabase/database'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

async function verifyManagerAccess() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new AppError('Authentication failed', ErrorCode.UNAUTHORIZED)
  }

  if (!user) {
    redirect('/login')
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employeeError) {
    throw new AppError('Failed to fetch employee role', ErrorCode.DATABASE)
  }

  if (!employee || employee.role !== 'manager') {
    redirect('/unauthorized')
  }

  return user
}

async function getStaffingRequirements() {
  const supabase = await createClient()

  const { data: requirements, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .order('time_block_start', { ascending: true })

  if (error) {
    throw new AppError('Failed to fetch staffing requirements', ErrorCode.DATABASE)
  }

  return requirements || []
}

export default async function RequirementsPage() {
  try {
    await verifyManagerAccess()

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
              <Suspense fallback={<RequirementsLoading />}>
                <RequirementsDataTable promise={getStaffingRequirements()} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError('An unexpected error occurred', ErrorCode.UNKNOWN)
  }
}
