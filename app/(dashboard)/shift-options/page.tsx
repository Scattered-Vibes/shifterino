'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/utils/error-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftOptionsDataTable } from './data-table'
import { ShiftOptionsTableSkeleton } from './loading'
import { CreateShiftOptionButton } from './create-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { requireManager } from '@/lib/auth/server'

async function getShiftOptions() {
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

  const { data: options, error } = await supabase
    .from('shift_options')
    .select('*')
    .order('category', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error

  return options || []
}

export default async function ShiftOptionsPage() {
  try {
    // This will redirect if not a manager
    await requireManager()

    // Fetch shift options data
    const options = await getShiftOptions()

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shift Options</h1>
            <p className="text-muted-foreground">
              Manage available shift options for scheduling.
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
                <ShiftOptionsDataTable options={options} />
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
