import type { ShiftCategory } from '../models/employee'
import type { ShiftPattern } from '../shift-patterns'
import type { StaffingRequirement } from '../models/staffing'
import type { ValidationError } from '../supabase/index'

export interface TimeBlock {
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  minTotalStaff: number
  minSupervisors: number
}

export type { ShiftCategory, ShiftPattern, StaffingRequirement, ValidationError } 