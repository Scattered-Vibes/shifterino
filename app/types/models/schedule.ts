import type { AuditableModel } from './index'
import type { UUID } from '../shared/common'
import type { ShiftPattern } from '../index'
import type { Employee } from './employee'
import type { IndividualShift } from './shift'

export interface Schedule extends AuditableModel {
  employeeId: UUID
  periodId: UUID
  startDate: string
  endDate: string
  isPublished: boolean
  publishedAt?: string
  publishedBy?: UUID
}

export interface SchedulePeriod extends AuditableModel {
  startDate: string
  endDate: string
  description?: string
  isPublished: boolean
  publishedAt?: string
  publishedBy?: UUID
}

export interface DatabaseStaffingRequirement extends AuditableModel {
  schedulePeriodId: UUID
  timeBlockStart: string
  timeBlockEnd: string
  dayOfWeek: number
  minTotalStaff: number
  minSupervisors: number
  isHoliday: boolean
  overrideReason?: string
}

export interface ShiftPatternRule extends AuditableModel {
  employeeId: UUID
  pattern: ShiftPattern
  startDate: string
  endDate?: string
  isDefault: boolean
}

export interface ShiftPatternTracking {
  consecutiveDays: number
  weeklyHours: number
  lastShiftDate?: string
}

export interface ScheduleGenerationConfig {
  startDate: string
  endDate: string
  employeeIds: UUID[]
  considerTimeOff: boolean
  allowOvertime: boolean
  enforcePatterns: boolean
}

export interface ScheduleValidation {
  isValid: boolean
  violations: PatternViolation[]
  gaps: StaffingGap[]
}

export interface PatternViolation {
  employeeId: UUID
  type: 'consecutive' | 'hours' | 'pattern'
  message: string
  dates: string[]
}

export interface ScheduleWithDetails extends Schedule {
  employee: Employee
  shifts: IndividualShift[]
}

export interface SchedulePeriodWithDetails extends SchedulePeriod {
  schedules: ScheduleWithDetails[]
  staffingRequirements: DatabaseStaffingRequirement[]
}

export interface ScheduleCreate {
  employeeId: UUID
  periodId: UUID
  startDate: string
  endDate: string
}

export interface ScheduleUpdate {
  isPublished?: boolean
  publishedAt?: string
  publishedBy?: UUID
}

export interface ScheduleConflict {
  type: 'overlap' | 'hours' | 'pattern'
  message: string
  dates: string[]
}

export interface ScheduleWithShifts extends Schedule {
  shifts: IndividualShift[]
}

export interface ScheduleWithEmployees extends Schedule {
  employees: Employee[]
}

export interface ScheduleStats {
  totalHours: number
  overtimeHours: number
  employeeCount: number
  shiftCount: number
  gapCount: number
}

export interface StaffingGap {
  date: string
  timeBlock: string
  required: number
  actual: number
  supervisorsRequired: number
  supervisorsActual: number
}

export interface ScheduleTemplate extends AuditableModel {
  name: string
  description?: string
  startDate: string
  endDate: string
  repeatPattern: 'weekly' | 'biweekly' | 'monthly'
  shifts: {
    employeeId: UUID
    shiftOptionId: UUID
    dayOfWeek: number
  }[]
} 