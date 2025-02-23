import { Database } from '@/types/supabase/database';

// Use the database types directly
export type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row'];
export type StaffingRequirementInsert = Database['public']['Tables']['staffing_requirements']['Insert'];
export type StaffingRequirementUpdate = Database['public']['Tables']['staffing_requirements']['Update'];

export interface StaffingPeriod {
  time_block_start: string; // HH:mm format
  time_block_end: string; // HH:mm format
  required_count: number;
  actual_count: number;
  supervisor_count: number;
  is_compliant: boolean;
}

export interface DailyStaffingReport {
  date: string;
  periods: StaffingPeriod[];
  is_compliant: boolean;
}

/**
 * Staffing requirement with additional computed fields
 */
export interface StaffingRequirementWithStats extends StaffingRequirement {
  actualStaffCount: number;
  supervisorCount: number;
  isMet: boolean;
}

/**
 * Staffing alert type
 */
export interface StaffingAlert {
  id: string;
  date: string;
  requirement_id: string;
  alert_type: 'UNFILLED_REQUIREMENT' | 'SUPERVISOR_MISSING' | 'PATTERN_VIOLATION';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  details: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Staffing override type
 */
export interface StaffingOverride {
  id: string;
  requirement_id: string;
  date: string;
  min_total_staff?: number;
  min_supervisors?: number;
  reason: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new staffing requirement
 */
export interface CreateStaffingRequirementInput {
  time_block_start: string;
  time_block_end: string;
  min_employees: number;
  requires_supervisor: boolean;
  crosses_midnight: boolean;
}

/**
 * Input type for updating an existing staffing requirement
 */
export interface UpdateStaffingRequirementInput extends Partial<CreateStaffingRequirementInput> {
  id: string;
} 