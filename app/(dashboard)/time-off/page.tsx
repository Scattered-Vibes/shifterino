import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TimeOffRequestForm from '../manage/components/TimeOffRequestForm'
import TimeOffRequests from '../manage/components/TimeOffRequests'
import { getTimeOffRequests } from '../manage/actions/time-off'

export default async function TimeOffPage() {
  const supabase = createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  // Get the employee record
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('auth_id', user.id)
    .single()

  if (employeeError || !employee) redirect('/complete-profile')

  // Get time off requests for the current employee
  const requests = await getTimeOffRequests(employee.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Time Off Requests</h1>
      </div>

      <div className="grid gap-6">
        <TimeOffRequestForm 
          employeeId={employee.id} 
        />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Requests</h2>
          <TimeOffRequests 
            requests={requests} 
          />
        </div>
      </div>
    </div>
  )
} 