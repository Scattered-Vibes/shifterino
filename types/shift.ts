export type ShiftPattern = '4x10' | '3x12+4'

export interface ShiftEvent {
  id: string
  employeeId: string
  employeeRole: 'dispatcher' | 'supervisor' | 'manager'
  title: string
  start: string // ISO date string
  end: string // ISO date string
  pattern: ShiftPattern
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  overrideHoursCap?: boolean
  notes?: string
}

export interface Duration {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export interface StaffingRequirement {
  timeStart: string // 24-hour format HH:mm
  timeEnd: string // 24-hour format HH:mm
  minStaff: number
  supervisorRequired: boolean
}

export interface TimeOffRequest {
  id: string
  employeeId: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  type: 'vacation' | 'sick' | 'personal' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  reviewedAt?: string // ISO date string
  reviewedBy?: string
}

export interface ShiftSwapRequest {
  id: string
  requestingEmployeeId: string
  requestedEmployeeId: string
  originalShiftId: string
  proposedShiftId: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  reviewedAt?: string // ISO date string
  reviewedBy?: string
}

export interface StaffingLevel {
  timeRange: string
  currentStaff: number
  requiredStaff: number
  hasSupervisor: boolean
  supervisorRequired: boolean
  isMet: boolean
}

export interface TimeRange {
  start: string // ISO date string
  end: string // ISO date string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface StaffingValidationResult extends ValidationResult {
  understaffedPeriods: {
    timeRange: string
    currentStaff: number
    requiredStaff: number
    isSupervisorMissing: boolean
  }[]
  overstaffedPeriods: {
    timeRange: string
    currentStaff: number
    requiredStaff: number
    excessStaff: number
  }[]
} 