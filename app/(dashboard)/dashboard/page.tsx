/**
 * DashboardPage Component
 * 
 * A server component that displays the main dashboard interface for authenticated users.
 * Shows personalized welcome message, quick action cards, and supervisor-specific options.
 * 
 * Features:
 * - Verifies user authentication and redirects to login if not authenticated
 * - Fetches employee data from Supabase based on auth session
 * - Displays personalized welcome message with employee's first name
 * - Shows quick action cards for common tasks (view schedule, request time off)
 * - Conditionally renders supervisor-specific management options
 * - Handles errors gracefully with redirect to error page
 * 
 * Authentication:
 * - Requires valid session from Supabase auth
 * - Redirects to /login if no session found
 * 
 * Database:
 * - Queries employees table in Supabase
 * - Matches employee record with auth_id from session
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardPage />
 * ```
 * 
 * @throws {Error} If database query fails
 * @returns {Promise<JSX.Element>} The rendered dashboard interface
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSkeleton } from '@/components/ui/skeletons'
import { DashboardError } from '@/components/ui/errors'
import { Suspense } from 'react'

async function DashboardContent() {
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login?error=Session expired')
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (employeeError) {
      if (employeeError.code === 'PGRST116') {
        return (
          <DashboardError 
            title="Profile Not Found"
            message="Your employee profile has not been set up yet. Please contact your administrator."
          />
        )
      }
      
      throw new Error('Failed to fetch employee data')
    }

    if (!employee) {
      return (
        <DashboardError 
          title="Profile Not Found"
          message="Your employee profile has not been set up yet. Please contact your administrator."
        />
      )
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Welcome, {employee.first_name}</h1>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Welcome back, {employee.first_name}!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This is your dashboard where you can view your schedule and manage your shifts.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-base font-medium text-gray-900">View Schedule</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Check your upcoming shifts and schedule.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-base font-medium text-gray-900">Request Time Off</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Submit and manage your time off requests.
                  </p>
                </div>
              </div>

              {employee.role === 'supervisor' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-base font-medium text-gray-900">Manage Team</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      View and manage team schedules.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <DashboardError 
        title="Error Loading Dashboard"
        message="There was a problem loading your dashboard. Please try again later."
      />
    )
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}