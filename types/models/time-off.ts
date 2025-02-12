export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  type: 'vacation' | 'sick' | 'personal' | 'other'
  status: TimeOffStatus
  reason?: string
  notes?: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  cancelled_by?: string
  cancelled_at?: string
  created_by: string
  created_at: string
  updated_at: string
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