import { type TimeBlock } from '@/types/schedule'
import { createClient } from '@/lib/supabase/server'
import { PostgrestError } from '@supabase/supabase-js'

interface StaffingRequirementRow {
  id: string;
  min_staff: number;
  supervisors_required: number;
  shift_options: {
    id: string;
    start_time: string;
    end_time: string;
  };
}

interface ScheduleRow {
  shift_option_id: string;
}

export async function getTimeBlocks(date: Date): Promise<TimeBlock[]> {
  const supabase = createClient()
  
  // Format date to YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0]
  
  const { data: requirements, error } = await supabase
    .from('staffing_requirements')
    .select(`
      id,
      min_staff,
      supervisors_required,
      shift_options (
        id,
        start_time,
        end_time
      )
    `)
    .eq('date', formattedDate)
    .order('shift_options.start_time') as { 
      data: StaffingRequirementRow[] | null; 
      error: PostgrestError | null; 
    }
  
  if (error || !requirements) {
    throw new Error('Failed to fetch staffing requirements')
  }
  
  // Get all scheduled shifts for the date
  const { data: schedules, error: staffError } = await supabase
    .from('schedules')
    .select('shift_option_id')
    .eq('date', formattedDate)
    .eq('status', 'scheduled') as {
      data: ScheduleRow[] | null;
      error: PostgrestError | null;
    }
  
  if (staffError) {
    throw new Error('Failed to fetch current staff counts')
  }
  
  // Count staff per shift option
  const staffCountMap = new Map<string, number>()
  schedules?.forEach(({ shift_option_id }) => {
    staffCountMap.set(
      shift_option_id, 
      (staffCountMap.get(shift_option_id) ?? 0) + 1
    )
  })
  
  // Transform the data to match our TimeBlock type
  return requirements.map((req) => ({
    id: req.id,
    startTime: req.shift_options.start_time,
    endTime: req.shift_options.end_time,
    minStaff: req.min_staff,
    currentStaff: staffCountMap.get(req.shift_options.id) ?? 0,
    supervisors: req.supervisors_required,
    date: formattedDate,
  }))
} 