import type { Database } from '@/types/supabase/database'
import type { BaseModel } from '../models/base'
import type { Employee, EmployeeRole } from '../models/employee'

// Database types
type Tables = Database['public']['Tables']
type ShiftTable = Tables['shifts']
type DBShift = ShiftTable['Row']

// Shift status from database enum
export type ShiftStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// Base shift interface
export interface Shift extends BaseModel {
  employee_id: string
  start_time: string // ISO date string
  end_time: string // ISO date string
  is_supervisor: boolean
  status: ShiftStatus
  notes?: string
}

// Shift with relationships
export interface ShiftWithEmployee extends Shift {
  employee: Employee
}

// UI event representation
export interface ShiftEvent {
  id: string
  employee_id: string
  employee_role: EmployeeRole
  title: string
  start: string // ISO date string
  end: string // ISO date string
  is_supervisor: boolean
  status: ShiftStatus
  notes?: string
}

// Input types
export type CreateShiftInput = Omit<Shift, keyof BaseModel>
export type UpdateShiftInput = Partial<CreateShiftInput>

// Shift swap types
export interface ShiftSwap extends BaseModel {
  requester_id: string
  requesting_shift_id: string
  target_employee_id: string
  target_shift_id: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

// Type guards
export function isShift(value: unknown): value is Shift {
  if (!value || typeof value !== 'object') return false
  
  return (
    'id' in value &&
    'employee_id' in value &&
    'start_time' in value &&
    'end_time' in value &&
    'is_supervisor' in value &&
    'status' in value
  )
}

export function isShiftWithEmployee(value: unknown): value is ShiftWithEmployee {
  return isShift(value) && 'employee' in value && typeof (value as any).employee === 'object'
}