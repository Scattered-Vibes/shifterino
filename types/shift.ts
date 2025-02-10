import { EventInput } from '@fullcalendar/core'
import type { Database } from './database'

export type Shift = Database['public']['Tables']['individual_shifts']['Row']

export interface ShiftEvent extends EventInput {
  id: string
  title: string
  start: string
  end: string
  extendedProps: {
    shiftOptionId: string
    employeeId: string
  }
}

export interface ShiftUpdateData {
  actual_start_time: string
  actual_end_time: string
  shift_option_id: string
  actual_hours_worked: number
} 