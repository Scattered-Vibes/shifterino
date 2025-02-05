import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StaffingOverview from './components/StaffingOverview'
import TimeOffRequests from './components/TimeOffRequests'
import ScheduleManager from './components/ScheduleManager'
import StaffList from './components/StaffList'
import { redirect } from 'next/navigation'
import type { EmployeeRole } from '@/types/database'

/**
 * ManagePage - Server Component for the Manager Dashboard.
 *
 * This component fetches the authenticated user and required data from Supabase,
 * verifies that the user holds a valid management role (manager or supervisor),
 * and renders the dashboard interface which includes staffing overview, pending 
 * time-off requests, and tabs for schedule and staff management.
 *
 * @returns {JSX.Element} The rendered management dashboard.
 */
export default async function ManagePage() {
  // Initialize Supabase client for server-side operations.
  const supabase = await createClient()
  
  // Retrieve authenticated user details.
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Redirect to login if the user is not authenticated or an error occurs.
  if (error || !user) {
    redirect('/login')
  }

  // Fetch the current employee's role from the 'employees' table based on their auth_id.
  const { data: currentEmployee, error: employeeError } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  // Throw an error if the request for employee data fails.
  if (employeeError) throw employeeError
  
  // Define allowed roles for accessing the management page.
  const managementRoles: EmployeeRole[] = ['manager', 'supervisor']
  // Redirect to dashboard if the user's role is not permitted for management.
  if (!currentEmployee?.role || !managementRoles.includes(currentEmployee.role)) {
    redirect('/overview')
  }

  // Fetch data for time-off requests, employee list, and schedules concurrently.
  const [
    { data: timeOffRequests, error: timeOffError },
    { data: employees, error: employeesError },
    { data: schedules, error: schedulesError }
  ] = await Promise.all([
    supabase.from('time_off_requests').select('*'),
    supabase.from('employees').select('*'),
    supabase.from('schedules').select('*')
  ])

  // If any of the data fetching operations fail, throw the respective error.
  if (timeOffError) throw timeOffError
  if (employeesError) throw employeesError
  if (schedulesError) throw schedulesError

  // Render the dashboard UI.
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
      </div>

      {/* Cards displaying staffing overview and time-off requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Current Staffing Overview</h2>
          <StaffingOverview schedules={schedules || []} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Time-Off Requests</h2>
          <TimeOffRequests requests={timeOffRequests || []} />
        </Card>
      </div>

      {/* Tabs for schedule management and staff management */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList>
          <TabsTrigger value="schedule">Schedule Management</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <Card className="p-6">
            <ScheduleManager 
              currentSchedule={schedules || []} 
              employees={employees || []} 
            />
          </Card>
        </TabsContent>
        <TabsContent value="staff">
          <Card className="p-6">
            <StaffList employees={employees || []} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}