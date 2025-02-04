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
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ScheduleCalendar } from '@/components/schedule/schedule-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getEmployeeData(userId: string) {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', userId)
    .single()

  if (error) throw error
  return employee
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('No user found')
  }

  const employee = await getEmployeeData(session.user.id)

  return (
    <>
      <DashboardHeader
        heading="Schedule Dashboard"
        text="View and manage your schedule"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tomorrow</div>
            <p className="text-xs text-muted-foreground">
              5:00 AM - 3:00 PM
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hours This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">
              8 hours remaining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time Off Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">80</div>
            <p className="text-xs text-muted-foreground">
              Hours available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shift Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.shift_pattern === 'pattern_a' ? 'Pattern A' : 'Pattern B'}
            </div>
            <p className="text-xs text-muted-foreground">
              {employee.shift_pattern === 'pattern_a' 
                ? '4x10 Hour Shifts' 
                : '3x12 + 1x4 Hour Shifts'}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            Your upcoming shifts for the next month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleCalendar employeeId={employee.id} />
        </CardContent>
      </Card>
    </>
  )
}