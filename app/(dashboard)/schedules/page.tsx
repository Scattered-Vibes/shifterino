import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface Schedule {
  id: string
  start_time: string
  end_time: string
  shift_type: string
  is_supervisor_shift: boolean
}

export default async function SchedulesPage() {
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

  // Get upcoming schedules for the current employee
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(10)

  if (schedulesError) throw schedulesError

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Your Schedule</h1>
      </div>

      <div className="grid gap-4">
        {schedules && schedules.length > 0 ? (
          schedules.map((schedule: Schedule) => (
            <Card key={schedule.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium capitalize">
                    {schedule.shift_type.replace('_', ' ')}
                    {schedule.is_supervisor_shift && ' (Supervisor)'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(schedule.start_time))} - {formatDate(new Date(schedule.end_time))}
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-4">
            <p className="text-sm text-gray-500">No upcoming shifts scheduled.</p>
          </Card>
        )}
      </div>
    </div>
  )
} 