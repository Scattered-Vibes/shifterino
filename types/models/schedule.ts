import type { StaffingRequirement } from './staffing'

export type ScheduleStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived'

export interface SchedulePeriod {
  id: string
  name: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  status: ScheduleStatus
  is_published: boolean
  created_by: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface ScheduleConflict {
  type: 'PATTERN_VIOLATION' | 'STAFFING_SHORTAGE' | 'REST_PERIOD' | 'OVERTIME'
  message: string
  details?: Record<string, unknown>
  severity: 'WARNING' | 'ERROR'
  date: string
  employeeId?: string
  shiftId?: string
  requirementId?: string
}

// Re-export for convenience
export type { StaffingRequirement }