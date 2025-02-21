import type { ShiftPattern, Holiday } from '@/types/shift-patterns'

export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled'
export type ShiftCategory = 'DAY' | 'SWING' | 'NIGHT'

export interface Employee {
  id: string
  name: string
  email: string
  role: 'supervisor' | 'dispatcher' | 'manager'
  shift_pattern: ShiftPattern
  weekly_hours_cap: number
  preferred_shift_category?: ShiftCategory
}

export interface ShiftOption {
  id: string
  startTime: string
  endTime: string
  durationHours: number
  category: ShiftCategory
}

export interface TimeOffRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface StaffingRequirement {
  id: string
  timeBlockStart: string
  timeBlockEnd: string
  minTotalStaff: number
  minSupervisors: number
}

export interface IndividualShift {
  employeeId: string
  shiftOptionId: string
  date: string
  status: ShiftStatus
  createdAt: string
  updatedAt: string
}

export interface ScheduleGenerationParams {
  startDate: string
  endDate: string
  employeeIds: string[]
}

export interface ScheduleGenerationResult {
  success: boolean
  shiftsGenerated: number
  errors?: string[]
  warnings?: string[]
}

export interface ShiftEvent {
  id: string
  employeeId: string
  employeeRole: 'supervisor' | 'dispatcher' | 'manager'
  start: string
  end: string
  date: string
  status: ShiftStatus
  pattern: ShiftPattern
  shiftOptionId: string
  title: string
}

export interface ShiftPatternState {
  consecutiveShifts: number
  lastShiftEnd: string | null
  currentPattern: ShiftPattern
}

export interface GenerationContext {
  periodId: string
  startDate: string
  endDate: string
  employees: Employee[]
  timeOffRequests: TimeOffRequest[]
  staffingRequirements: StaffingRequirement[]
  shiftOptions: ShiftOption[]
  params: ScheduleGenerationParams
  weeklyHours: Record<string, Record<string, number>>
  shiftPatterns: Record<string, ShiftPatternState>
  existingShifts: IndividualShift[]
  holidays: Holiday[]
}

export interface Schedule {
  shift_id: string
  start_time: string // HH:mm
  end_time: string // HH:mm
  employee_id: string
}

export interface ScheduleGenerationOptions {
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  employees: Employee[]
  shift_options: ShiftOption[]
  staffing_requirements: StaffingRequirement[]
  existing_schedules?: Schedule[]
}

export interface ScheduleConflict {
  type: 'overlap' | 'hours_exceeded' | 'pattern_violation'
  message: string
  schedule_id: string
  employee_id: string
  date: string
  details?: Record<string, unknown>
}

export interface ShiftAssignment {
  employee_id: string
  shift_option_id: string
  date: Date
  is_overtime: boolean
  score: number
}