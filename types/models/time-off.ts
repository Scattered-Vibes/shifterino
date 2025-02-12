import type { Database } from '../supabase/database'
import type { Employee } from './employee'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type TimeOffRequest = Tables['time_off_requests']['Row']
export type TimeOffRequestInsert = Tables['time_off_requests']['Insert']
export type TimeOffRequestUpdate = Tables['time_off_requests']['Update']
export type TimeOffStatus = Enums['time_off_status']

// Extended Types
export interface TimeOffRequestWithDetails extends TimeOffRequest {
  employee: Employee
  affected_shifts: {
    id: string
    date: string
    start_time: string
    end_time: string
  }[]
}

// Create Types
export interface CreateTimeOffRequestInput {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  notes?: string
}

// Update Types
export type UpdateTimeOffRequestInput = Partial<Omit<CreateTimeOffRequestInput, 'employee_id'>> & {
  status?: TimeOffStatus
}

// Filter Types
export interface TimeOffRequestFilters {
  start_date?: string
  end_date?: string
  employee_id?: string
  status?: TimeOffStatus
}

// Sort Types
export type TimeOffRequestSortField = 
  | 'start_date'
  | 'end_date'
  | 'employee_name'
  | 'status'
  | 'created_at'

export interface TimeOffRequestSort {
  field: TimeOffRequestSortField
  direction: 'asc' | 'desc'
}

// Utility Types
export interface TimeOffValidation {
  is_valid: boolean
  errors: {
    type: 'overlap' | 'notice' | 'eligibility'
    message: string
  }[]
}

export interface TimeOffStatistics {
  total_requests: number
  approved_requests: number
  pending_requests: number
  rejected_requests: number
  total_days: number
  average_duration: number
}

export interface TimeOffBalance {
  id: string
  employee_id: string
  year: number
  vacation_hours: number
  sick_hours: number
  personal_hours: number
  carryover_hours: number
  used_vacation_hours: number
  used_sick_hours: number
  used_personal_hours: number
  created_at: string
  updated_at: string
} 