import type { Employee, TimeOffRequest, StaffingRequirement } from '@/types/supabase/index'
import type { ShiftEvent } from './shift'
import type { ShiftOption, IndividualShift } from '../models/shift'

export type {
  Employee,
  ShiftOption,
  IndividualShift,
  TimeOffRequest,
  StaffingRequirement
}

export interface TimeBlock {
  start: string // ISO time string
  end: string // ISO time string
  minStaff: number
  supervisorRequired: boolean
}

export interface Schedule {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  shiftId: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: 'pending' | 'approved' | 'completed'
  notes?: string
}

export interface ScheduleGenerationOptions {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  employees: Employee[]
  shiftOptions: ShiftOption[]
  staffingRequirements: TimeBlock[]
  existingSchedules?: Schedule[]
}

export interface ScheduleConflict {
  type: 'overlap' | 'hours_exceeded' | 'pattern_violation'
  message: string
  scheduleId: string
  employeeId: string
  date: string
  details?: Record<string, unknown>
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

export interface Holiday {
  date: string
  name: string
  isObserved: boolean
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
  shiftPatterns: Record<string, ShiftPattern>
  existingShifts: ShiftEvent[]
  holidays: Holiday[]
}

export interface ShiftPattern {
  consecutiveShifts: number
  lastShiftEnd: Date | null
  currentPattern: 'PATTERN_A' | 'PATTERN_B'
}

export interface ShiftAssignment {
  employeeId: string
  shiftOptionId: string
  date: Date
  isOvertime: boolean
  score: number
} 