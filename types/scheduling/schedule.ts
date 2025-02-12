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

export interface Schedule {
  id: string
  employeeId: string
  date: string | Date
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  shiftType: string
  startTime: string
  endTime: string
  notes?: string
  createdAt: string
  updatedAt: string
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