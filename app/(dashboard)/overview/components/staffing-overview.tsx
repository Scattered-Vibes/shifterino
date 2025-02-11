'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/app/lib/supabase/client'
import type { Tables } from '@/app/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type StaffingRequirement = Tables['staffing_requirements']['Row']
type IndividualShift = Tables['individual_shifts']['Row']

export function StaffingOverview() {
  const supabase = createClient()

  const { data: requirements } = useQuery({
    queryKey: ['staffing-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staffing_requirements')
        .select('*')
        .order('time_block_start', { ascending: true })

      if (error) throw error
      return data as StaffingRequirement[]
    },
  })

  const { data: currentShifts } = useQuery({
    queryKey: ['current-shifts'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('individual_shifts')
        .select('*')
        .eq('date', now.split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      return data as IndividualShift[]
    },
  })

  if (!requirements || !currentShifts) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {requirements.map((req) => {
        const currentStaffCount = currentShifts.filter((shift) => {
          const shiftTime = new Date(shift.date + 'T' + shift.start_time)
          return shiftTime >= new Date(req.time_block_start) && 
                 shiftTime <= new Date(req.time_block_end)
        }).length

        const staffingPercentage = (currentStaffCount / req.min_total_staff) * 100

        return (
          <Card key={req.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {new Date(req.time_block_start).toLocaleTimeString()} - 
                {new Date(req.time_block_end).toLocaleTimeString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentStaffCount} / {req.min_total_staff}
              </div>
              <Progress
                value={staffingPercentage}
                className="mt-2"
                indicatorColor={staffingPercentage >= 100 ? 'bg-green-500' : 'bg-red-500'}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {staffingPercentage >= 100 ? 'Fully Staffed' : 'Understaffed'}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 