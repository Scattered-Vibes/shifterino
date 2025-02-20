import type { Database } from '../supabase/database'
import type { StaffingRequirement } from '../models/staffing'
import type { Schedule, ScheduleStatus } from '../models/schedule'

// Database types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeSlot {
  start_hour: number;
  end_hour: number;
  days: DayOfWeek[];
}

// Constraint Types
export interface SchedulingConstraints {
  max_hours_per_week: number;
  min_hours_per_week: number;
  max_consecutive_days: number;
  min_rest_hours_between_shifts: number;
  require_supervisor_presence: boolean;
}

// Re-export the Schedule type
export type { Schedule, ScheduleStatus }

export interface ShiftOption {
  id: string;
  name: string;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format;
  duration_hours: number;
  is_supervised: boolean;
  required_role: string;
  break_duration_minutes: number;
}

export interface ShiftPattern {
  id: string;
  name: string;
  description?: string;
  shifts: ShiftPatternEntry[];
  total_hours: number;
  days_in_pattern: number;
}

export interface ShiftPatternEntry {
  day_offset: number;
  duration: number; // in hours
  shift_option_id: string;
}

// Generation Types
export interface ScheduleGenerationParams {
  start_date: string;
  end_date: string;
  consider_preferences?: boolean;
  allow_overtime?: boolean;
  max_overtime_hours?: number;
  schedule_period_id: string;
}

export interface ScheduleGenerationResult {
  success: boolean;
  shifts_generated: number;
  unfilled_requirements: number;
  errors?: string[];
  warnings?: string[];
}

export interface GenerationContext {
  period_id: string;
  start_date: string;
  end_date: string;
  employees: Tables['employees']['Row'][];
  time_off_requests: TimeOffRequest[];
  staffing_requirements: StaffingRequirement[];
  shift_options: ShiftOption[];
  params: ScheduleGenerationParams;
  weekly_hours: Record<string, number>;
  shift_patterns: Record<string, ShiftPattern>;
  holidays: Holiday[];
}

// Validation Types
export interface ScheduleValidation {
  is_valid: boolean;
  conflicts: SchedulingConflict[];
  warnings: string[];
  suggestions: string[];
}

export interface SchedulingConflict {
  id: string;
  type: ConflictType;
  severity: 'error' | 'warning';
  message: string;
  affected_shifts: string[];
  start_time: string;
  end_time: string;
  resolution?: ConflictResolution;
}

export type ConflictType = 'overlap' | 'pattern' | 'hours' | 'staffing' | 'supervisor' | 'rest';

export interface ConflictResolution {
  action: 'reassign' | 'adjust' | 'split' | 'delete';
  shift_id: string;
  new_employee_id?: string;
  adjusted_time?: string;
}

// Supporting Types
export interface Holiday {
  date: string;
  name: string;
  is_observed: boolean;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'vacation' | 'sick' | 'personal';
  notes?: string;
}

// Re-export database types
export type Employee = Tables['employees']['Row'];
export type EmployeeRole = Enums['employee_role']; 