import type { AuditableModel } from './index'
import type { ShiftPattern, ShiftCategory, EmployeeRole } from '../index'
import type { UUID, DateRange } from '../shared/common'

export interface Employee extends AuditableModel {
  authId: UUID
  email: string
  firstName: string
  lastName: string
  role: EmployeeRole
  weeklyHoursCap: number
  maxOvertimeHours: number
  profileCompleted: boolean
  isActive: boolean
  teamId?: UUID
  supervisorId?: UUID
  shiftPattern: ShiftPattern
  preferredShiftCategory: ShiftCategory
}

export interface EmployeeBasic {
  id: UUID
  firstName: string
  lastName: string
  email: string
  role: EmployeeRole
}

export interface EmployeeSchedulePreferences {
  preferredShiftCategory: ShiftCategory
  shiftPattern: ShiftPattern
  weeklyHoursCap: number
  maxOvertimeHours: number
}

export interface EmployeeStats {
  totalHoursScheduled: number
  overtimeHours: number
  timeOffHours: number
  completedShifts: number
  missedShifts: number
}

export interface EmployeeWithSchedule extends Employee {
  schedule: DateRange[]
}

export interface EmployeeWithShifts extends Employee {
  shifts: {
    date: string
    startTime: string
    endTime: string
    category: ShiftCategory
  }[]
}

export interface EmployeeAvailability {
  employeeId: UUID
  availableDates: DateRange[]
  unavailableDates: DateRange[]
  preferredTimes: {
    [key: string]: string[] // day -> preferred times
  }
} 