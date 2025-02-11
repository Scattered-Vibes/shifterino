import { type Database } from './supabase/database'

export type ShiftEvent = {
  id: string
  title: string
  start: Date
  end: Date
  employee_id: string
  is_supervisor: boolean
  status: 'scheduled' | 'completed' | 'cancelled'
  actual_start_time: string | null
  actual_end_time: string | null
  notes: string | null
}

export type Duration = {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export type Shift = Database['public']['Tables']['individual_shifts']['Row']

export type ShiftUpdateData = Partial<
  Omit<Database['public']['Tables']['individual_shifts']['Update'], 'id'>
> 