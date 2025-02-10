export type ShiftPattern = 'PATTERN_A' | 'PATTERN_B'
export type ShiftCategory = 'DAY_EARLY' | 'DAY' | 'SWING' | 'GRAVEYARD'
export type EmployeeRole = 'SUPERVISOR' | 'DISPATCHER'
export type ShiftStatus = 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type SwapRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type OnCallStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface SchedulePeriod {
  id: string
  start_date: string
  end_date: string
}

export interface Employee {
  id: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  preferred_shift_category: ShiftCategory
  weekly_hours_cap: number
  max_overtime_hours: number | null
  is_active: boolean
}

export interface StaffingRequirement {
  id: string
  time_block: string
  min_total_staff: number
  min_supervisors: number
  requires_supervisor: boolean
  start_time: string
  end_time: string
  is_holiday: boolean
}

export interface ShiftOption {
  id: string
  category: ShiftCategory
  start_time: string
  end_time: string
  duration_hours: number
  crosses_midnight: boolean
}

export interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface IndividualShift {
  id?: string
  employee_id: string
  shift_option_id: string
  schedule_period_id: string
  date: string
  status: ShiftStatus
  actual_start_time: string
  actual_end_time: string
  is_overtime: boolean
  requested_overtime: boolean
  overtime_approved_by?: string
  overtime_approved_at?: string
  overtime_hours?: number
}

export interface WeeklyHoursTracking {
  [employeeId: string]: {
    [weekStartDate: string]: number
  }
}

export interface ShiftPatternTracking {
  [employeeId: string]: {
    currentPattern: ShiftPattern
    consecutiveDays: number
    lastShiftDate: string | null
  }
}

export interface ScheduleGenerationParams {
  schedulePeriodId: string
  considerExisting?: boolean
}

export interface ScheduleGenerationResult {
  success: boolean
  error?: string
  data?: {
    scheduledShifts: IndividualShift[]
    unfilledRequirements: {
      date: string
      requirementId: string
      shortfall: number
    }[]
  }
}

export interface ShiftSwapRequest {
  id?: string
  requesting_shift_id: string
  target_shift_id?: string
  requesting_employee_id: string
  target_employee_id?: string
  reason?: string
  status: SwapRequestStatus
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface OnCallAssignment {
  id?: string
  employee_id: string
  schedule_period_id: string
  start_date: string
  end_date: string
  status: OnCallStatus
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface OnCallActivation {
  id?: string
  assignment_id: string
  start_time: string
  end_time?: string
  reason: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string;
  changed_by: string;
  old_values: JsonValue | null;
  new_values: JsonValue | null;
  created_at: string;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface OvertimeReport {
  employee_id: string
  first_name: string
  last_name: string
  schedule_period_id: string
  start_date: string
  end_date: string
  total_shifts: number
  total_overtime_hours: number
  approved_overtime_hours: number
}

export interface StaffingLevelReport {
  requirement_id: string
  time_block: string
  min_total_staff: number
  min_supervisors: number
  date: string
  actual_staff_count: number
  actual_supervisor_count: number
  is_understaffed: boolean
} 