import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
export type TimeOffRequest = Tables['time_off_requests']['Row']
export type TimeOffStatus = TimeOffRequest['status']

export interface TimeOffRequestWithEmployee extends TimeOffRequest {
  employee: Tables['employees']['Row']
}

export interface TimeOffUpdateData {
  start_date?: string
  end_date?: string
  reason?: string
  status?: TimeOffStatus
  notes?: string
}

export interface GetTimeOffRequestsOptions {
  employeeId?: string
  status?: TimeOffStatus
  startDate?: string
  endDate?: string
  includeEmployee?: boolean
} 