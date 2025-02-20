import type { Database } from '../supabase/database'

type Tables = Database['public']['Tables']

/**
 * Base staffing requirement type from database
 */
export type StaffingRequirement = Tables['staffing_requirements']['Row']

/**
 * Staffing requirement with additional computed fields
 */
export interface StaffingRequirementWithStats extends StaffingRequirement {
  actualStaffCount: number
  supervisorCount: number
  isMet: boolean
}

/**
 * Staffing alert type
 */
export interface StaffingAlert {
  id: string
  date: string
  requirement_id: string
  alert_type: 'UNFILLED_REQUIREMENT' | 'SUPERVISOR_MISSING' | 'PATTERN_VIOLATION'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  details: string
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

/**
 * Staffing override type
 */
export interface StaffingOverride {
  id: string
  requirement_id: string
  date: string
  min_total_staff?: number
  min_supervisors?: number
  reason: string
  approved_by?: string
  approved_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a new staffing requirement
 */
export type CreateStaffingRequirementInput = Omit<
  StaffingRequirement,
  'id' | 'created_at' | 'updated_at'
>

/**
 * Input type for updating an existing staffing requirement
 */
export type UpdateStaffingRequirementInput = Partial<CreateStaffingRequirementInput> 