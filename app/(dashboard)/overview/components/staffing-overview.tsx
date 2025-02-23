'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase/database'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type Tables = Database['public']['Tables']
type Shift = Tables['shifts']['Row'] & {
  shift_assignments: Tables['shift_assignments']['Row'][]
}

export function StaffingOverview() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadShifts() {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          shift_assignments (*)
        `)
        .eq('date', today)
        .order('start_time')

      if (!error && data) {
        setShifts(data as Shift[])
      }
      setLoading(false)
    }

    loadShifts()
  }, [supabase])

  if (loading) {
    return <Progress value={undefined} className="w-full" />
  }

  return (
    <div className="space-y-6">
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Shifts</h2>
        <div className="space-y-4">
          {shifts.length === 0 ? (
            <p className="text-gray-500">No shifts scheduled for today.</p>
          ) : (
            shifts.map((shift) => (
              <div key={shift.id} className="border-b pb-4">
                <p className="font-medium">
                  {shift.start_time} - {shift.end_time}
                </p>
                <p className="text-sm text-gray-600">
                  {shift.shift_assignments.length} staff assigned
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
} 