import type { Database } from '@/app/types/supabase/database'
import type { EmployeeBasic } from './employee'

// Database types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

export type TimeOffRequest = Tables['time_off_requests']['Row']
export type TimeOffStatus = Enums['time_off_status']

// Extended types with relationships
export interface TimeOffRequestWithDetails extends TimeOffRequest {
  employee: EmployeeBasic
}

// Create/Update types
export type TimeOffRequestCreate = Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at'> & {
  status?: TimeOffStatus
}

export type TimeOffRequestUpdate = {
  status: TimeOffStatus
  notes?: string
} 