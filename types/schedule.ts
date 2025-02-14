export interface StaffingRequirement {
  id: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  minEmployees: number
  requiresSupervisor: boolean
}

export interface ShiftAssignment {
  id: string
  employeeId: string
  shiftId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isSupervisor: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury-duty'
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

export interface TimeOffRequest {
  id: string
  employeeId: string
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
  type: TimeOffType
  status: TimeOffStatus
  notes?: string
} 