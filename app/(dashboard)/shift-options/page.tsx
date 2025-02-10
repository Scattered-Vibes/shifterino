'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftOptionsDataTable } from './data-table'
import { ShiftOptionsTableSkeleton } from './loading'
import { CreateShiftOptionButton } from './create-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { Database } from '@/types/database'

type ShiftOption = Database['public']['Tables']['shift_options']['Row']

async function getShiftOptions() {
  const supabase = createClient()

  const { data: options, error } = await supabase
    .from('shift_options')
    .select('*')
    .order('category', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return options || []
}

export default async function ShiftOptionsPage() {
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
            <h1 className="text-2xl font-bold">Shift Options</h1>
            <p className="text-muted-foreground">
              Manage shift types and their time blocks.
            </p>
          </div>
          <CreateShiftOptionButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Shift Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<ShiftOptionsTableSkeleton />}>
                <ShiftOptionsDataTable promise={getShiftOptions()} />
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
