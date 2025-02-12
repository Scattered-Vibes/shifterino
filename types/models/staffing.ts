export interface StaffingRequirement {
  id: string
  name: string
  time_block_start: string // HH:mm format
  time_block_end: string // HH:mm format
  min_total_staff: number
  min_supervisors: number
  day_of_week?: number // 0-6, where 0 is Sunday
  is_holiday?: boolean
  start_date?: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
  schedule_period_id?: string
  override_reason?: string
  created_at: string
  updated_at: string
}

export interface StaffingAlert {
  id: string
  date: string
  requirement_id: string
  alert_type: 'UNFILLED_REQUIREMENT' | 'SUPERVISOR_MISSING' | 'PATTERN_VIOLATION'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  details: string
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface StaffingOverride {
  id: string
  requirement_id: string
  date: string
  min_total_staff?: number
  min_supervisors?: number
  reason: string
  approved_by?: string
  approved_at?: string
  created_by: string
  created_at: string
  updated_at: string
} 