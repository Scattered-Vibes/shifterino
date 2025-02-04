import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface ShiftOption {
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  category: string
}

interface Schedule {
  id: string
  date: string
  actual_start_time: string | null
  actual_end_time: string | null
  is_overtime: boolean
  shift_option: ShiftOption
}

type ScheduleResponse = Omit<Schedule, 'shift_option'> & {
  shift_option: ShiftOption[]
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

  // Get upcoming shifts for the current employee
  const { data: schedulesData, error: schedulesError } = await supabase
    .from('individual_shifts')
    .select(`
      id,
      date,
      actual_start_time,
      actual_end_time,
      is_overtime,
      shift_option:shift_option_id (
        name,
        start_time,
        end_time,
        duration_hours,
        category
      )
    `)
    .eq('employee_id', employee.id)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(10)

  if (schedulesError) throw schedulesError

  // Transform the data to match our Schedule interface
  const schedules: Schedule[] = (schedulesData as ScheduleResponse[]).map(schedule => ({
    ...schedule,
    shift_option: schedule.shift_option[0]
  }))

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
                    {schedule.shift_option.name}
                    {schedule.is_overtime && ' (Overtime)'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(`${schedule.date}T${schedule.shift_option.start_time}`))} - 
                    {formatDate(new Date(`${schedule.date}T${schedule.shift_option.end_time}`))}
                  </p>
                  {schedule.actual_start_time && schedule.actual_end_time && (
                    <p className="text-xs text-gray-400">
                      Actual: {formatDate(new Date(schedule.actual_start_time))} - 
                      {formatDate(new Date(schedule.actual_end_time))}
                    </p>
                  )}
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