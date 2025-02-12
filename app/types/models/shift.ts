import type { AuditableModel } from './index'
import type { UUID } from '../shared/common'
import type { ShiftCategory, ShiftStatus } from '../index'
import type { Employee } from './employee'

export interface ShiftOption extends AuditableModel {
  name: string
  startTime: string
  endTime: string
  durationHours: number
  category: ShiftCategory
}

export interface IndividualShift extends AuditableModel {
  employeeId: UUID
  shiftOptionId: UUID
  schedulePeriodId: UUID
  date: string
  status: ShiftStatus
  actualStartTime?: string
  actualEndTime?: string
  notes?: string
}

export interface ShiftEvent {
  id: UUID
  title: string
  start: string
  end: string
  employeeId: UUID
  status: ShiftStatus
  category: ShiftCategory
}

export interface ShiftSwapRequest extends AuditableModel {
  requestingEmployeeId: UUID
  receivingEmployeeId?: UUID
  requestingShiftId: UUID
  receivingShiftId?: UUID
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requestedAt: string
  approvedRejectedAt?: string
  approvedRejectedBy?: UUID
}

export interface ShiftTemplate extends AuditableModel {
  name: string
  shiftOptionId: UUID
  repeatDays: number[]
  startDate: string
  endDate: string
  employeeIds: UUID[]
}

export interface ShiftWithEmployee extends IndividualShift {
  employee: Employee
}

export interface ShiftWithSchedule extends IndividualShift {
  schedule: {
    id: UUID
    startDate: string
    endDate: string
  }
}

export interface ShiftValidation {
  isValid: boolean
  conflicts: ShiftConflict[]
}

export interface ShiftConflict {
  type: 'overlap' | 'hours' | 'pattern'
  message: string
  conflictingShiftId?: UUID
}

export interface ShiftCreate {
  employeeId: UUID
  shiftOptionId: UUID
  date: string
  notes?: string
}

export interface ShiftStats {
  totalShifts: number
  completedShifts: number
  missedShifts: number
  averageHours: number
  overtimeHours: number
}

export interface ShiftUpdateData {
  status?: ShiftStatus
  actualStartTime?: string
  actualEndTime?: string
  notes?: string
}