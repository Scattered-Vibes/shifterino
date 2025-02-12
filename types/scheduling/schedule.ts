import type { Employee } from '../models/employee'
import type { ShiftOption, IndividualShift } from '../models/shift'
import type { TimeOffRequest } from '../models/time-off'
import type { StaffingRequirement } from '../models/staffing'

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
  startDate: Date
  endDate: Date
  considerPreferences?: boolean
  allowOvertime?: boolean
  maxOvertimeHours?: number
}

export interface ScheduleGenerationResult {
  success: boolean
  shiftsGenerated: number
  errors?: string[]
  warnings?: string[]
}

export interface GenerationContext {
  periodId: string
  startDate: Date
  endDate: Date
  employees: Employee[]
  shiftOptions: ShiftOption[]
  staffingRequirements: StaffingRequirement[]
  timeOffRequests: TimeOffRequest[]
  params: ScheduleGenerationParams
  weeklyHours: Record<string, Record<string, number>>
  shiftPatterns: Record<string, {
    consecutiveShifts: number
    lastShiftEnd: Date | null
  }>
  holidays: Array<{
    date: string
    name: string
    isObserved: boolean
  }>
}

export interface ShiftAssignment {
  employeeId: string
  shiftOptionId: string
  date: Date
  isOvertime: boolean
  score: number
} 