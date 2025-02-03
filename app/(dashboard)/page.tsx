import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * DashboardPage Component
 *
 * This server component renders the main dashboard interface for authenticated users.
 * It performs the following tasks:
 * - Initializes the Supabase client for server-side operations.
 * - Retrieves the authenticated user's data.
 * - Fetches the employee record related to the current user.
 * - Redirects to the login page if authentication fails.
 * - Prompts the user to complete their profile if no employee record is found.
 * - Displays a personalized welcome message along with quick action cards.
 * - Conditionally renders supervisor-specific options if the employee's role is 'supervisor'.
 *
 * @returns {Promise<JSX.Element>} The dashboard UI or a redirection response.
 */
export default async function DashboardPage() {
  try {
    // Initialize Supabase client for server-side operations.
    const supabase = await createClient()

    // Retrieve authenticated user data from Supabase.
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Dashboard - Current user:', user?.id)

    // Redirect to login if authentication fails.
    if (userError || !user) {
      console.error('Dashboard - Auth error:', userError)
      redirect('/login')
    }

    // Fetch the employee record corresponding to the authenticated user.
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    console.log('Dashboard - Employee query:', {
      userId: user.id,
      employee: employee || null,
      error: employeeError || null
    })

    // If the employee record is missing (error code 'PGRST116'),
    // display a prompt for the user to complete their profile.
    if (employeeError?.code === 'PGRST116') {
      console.log('Dashboard - No employee record found, redirecting to complete profile')
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Welcome to Shifterino</h1>
            <p className="text-muted-foreground">
              Your account is created, but we need some additional information to complete your profile.
            </p>
            <Link href="/complete-profile">
              <Button>Complete Your Profile</Button>
            </Link>
          </div>
        </div>
      )
    }

    // Handle any other errors encountered during employee record fetch.
    if (employeeError) {
      console.error('Dashboard - Employee fetch error:', employeeError)
      throw employeeError
    }

    // Render the dashboard view with a personalized welcome message and quick action cards.
    return (
      <div className="space-y-6">
        <div>
          {/* Personalized welcome message */}
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Welcome back, {employee?.first_name}!
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This is your dashboard where you can view your schedule and manage your shifts.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick action card: View Schedule */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-base font-medium text-gray-900">View Schedule</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Check your upcoming shifts and schedule.
                </p>
              </div>
            </div>

            {/* Quick action card: Request Time Off */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-base font-medium text-gray-900">Request Time Off</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Submit and manage your time off requests.
                </p>
              </div>
            </div>

            {/* Quick action card for supervisors: Manage Team */}
            {employee?.role === 'supervisor' && (
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
    )
  } catch (error) {
    // Log unexpected errors and rethrow them.
    console.error('Dashboard - Unexpected error:', error)
    throw error
  }
}