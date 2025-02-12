import type { Employee } from '../models/employee'

export interface ShiftEvent {
  id: string
  title: string
  start: string // ISO datetime
  end: string // ISO datetime
  employeeId: string
  employee?: Employee
  status: 'pending' | 'approved' | 'completed'
  isOnCall?: boolean
  notes?: string
}

export interface ShiftUpdateData {
  startTime: string // HH:mm
  endTime: string // HH:mm
  employeeId: string
  notes?: string
}

export interface ShiftSwapRequest {
  id: string
  requesterId: string
  requesterShiftId: string
  targetEmployeeId: string
  targetShiftId: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OnCallSchedule {
  id: string
  employeeId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  status: 'active' | 'inactive'
  notes?: string
}

export interface Duration {
  hours: number
  minutes: number
} 