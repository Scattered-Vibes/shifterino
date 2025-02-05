export type EmployeeRole = 'manager' | 'supervisor' | 'dispatcher'
export type ShiftPattern = 'pattern_a' | 'pattern_b'
export type ShiftCategory = 'early' | 'day' | 'swing' | 'graveyard'
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

export interface Employee {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  preferred_shift_category?: ShiftCategory
  weekly_hours_cap: number
  created_at: string
  updated_at: string
}

export interface EmployeeWithUser extends Employee {
  user: {
    id: string
    email: string
  }
}

export interface Schedule {
  id: string
  employee_id: string
  shift_date: string
  shift_category: ShiftCategory
  start_time: string
  end_time: string
  is_supervisor_shift: boolean
  created_at: string
  updated_at: string
}

export interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  status: TimeOffStatus
  reason?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface OvertimeApproval {
  id: string
  employee_id: string
  schedule_id: string
  approved_by: string
  hours_approved: number
  created_at: string
}

// Helper type for schedule time periods
export interface TimePeriod {
  start: string // HH:mm format
  end: string
  min_staff: number
}

export const TIME_PERIODS: Record<string, TimePeriod> = {
  EARLY_MORNING: {
    start: '05:00',
    end: '09:00',
    min_staff: 6
  },
  DAY: {
    start: '09:00',
    end: '21:00',
    min_staff: 8
  },
  EVENING: {
    start: '21:00',
    end: '01:00',
    min_staff: 7
  },
  LATE_NIGHT: {
    start: '01:00',
    end: '05:00',
    min_staff: 6
  }
}

// Helper type for shift patterns
export const SHIFT_PATTERNS = {
  PATTERN_A: {
    name: 'pattern_a' as ShiftPattern,
    description: 'Four consecutive 10-hour shifts',
    hours_per_shift: 10,
    consecutive_shifts: 4
  },
  PATTERN_B: {
    name: 'pattern_b' as ShiftPattern,
    description: 'Three consecutive 12-hour shifts plus one 4-hour shift',
    hours_per_shift: [12, 12, 12, 4],
    consecutive_shifts: 4
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          role: 'dispatcher' | 'supervisor' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          role: 'dispatcher' | 'supervisor' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          role?: 'dispatcher' | 'supervisor' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: Schedule
        Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at'>>
      }
      time_off_requests: {
        Row: TimeOffRequest
        Insert: Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at'>>
      }
      overtime_approvals: {
        Row: OvertimeApproval
        Insert: Omit<OvertimeApproval, 'id' | 'created_at'>
        Update: Partial<Omit<OvertimeApproval, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      employee_role: EmployeeRole
      shift_pattern: ShiftPattern
      shift_category: ShiftCategory
      time_off_status: TimeOffStatus
    }
  }
} 