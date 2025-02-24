import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']
export type ShiftSwapRequest = Tables['shift_swap_requests']['Row']
export type ShiftSwapStatus = ShiftSwapRequest['status']

export interface ShiftSwapRequestWithDetails extends ShiftSwapRequest {
  requesting_employee: Tables['employees']['Row']
  receiving_employee: Tables['employees']['Row']
  shift: Tables['individual_shifts']['Row']
}

export interface ShiftSwapUpdateData {
  receiving_employee_id?: string
  status?: ShiftSwapStatus
  notes?: string
}

export interface GetShiftSwapRequestsOptions {
  requestingEmployeeId?: string
  receivingEmployeeId?: string
  status?: ShiftSwapStatus
  startDate?: string
  endDate?: string
  includeDetails?: boolean
} 