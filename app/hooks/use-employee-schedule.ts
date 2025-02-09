import { useQuery } from '@tanstack/react-query'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function useEmployeeSchedule(employeeId: string) {
  return useQuery({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      const cookieStore = cookies()
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: true })

      if (error) throw error
      return data
    },
  })
} 