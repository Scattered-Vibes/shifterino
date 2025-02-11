import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/app/lib/supabase/client'

export function useEmployeeSchedule(employeeId: string) {
  const supabase = createClient()
  const { toast } = useToast()

  return useQuery({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_shifts')
        .select(`
          *,
          shift_option:shift_options(*)
        `)
        .eq('employee_id', employeeId)
        .order('date', { ascending: true })

      if (error) {
        toast({
          title: 'Error fetching schedule',
          description: error.message,
          variant: 'destructive',
        })
        throw error
      }

      return data
    },
  })
} 