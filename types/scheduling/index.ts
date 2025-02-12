import type { Database } from '../supabase/database'

// Database types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Base Types
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeSlot {
  startHour: number;
  endHour: number;
  days: DayOfWeek[];
}

// Constraint Types
export interface SchedulingConstraints {
  maxHoursPerWeek: number;
  minHoursPerWeek: number;
  maxConsecutiveDays: number;
  minRestHoursBetweenShifts: number;
  requireSupervisorPresence: boolean;
}

// Entity Types
export interface Schedule {
  id: string;
  employeeId: string;
  date: string;
  status: ScheduleStatus;
  shiftOptionId: string;
  isOvertime: boolean;
  isRegularSchedule: boolean;
  shiftScore: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  supervisorApprovedAt?: string;
  supervisorApprovedBy?: string;
}

export type ScheduleStatus = 'draft' | 'scheduled' | 'published' | 'completed' | 'cancelled';

export interface ShiftOption {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format;
  durationHours: number;
  isSupervised: boolean;
  requiredRole: string;
  breakDurationMinutes: number;
}

export interface ShiftPattern {
  id: string;
  name: string;
  description?: string;
  shifts: ShiftPatternEntry[];
  totalHours: number;
  daysInPattern: number;
}

export interface ShiftPatternEntry {
  dayOffset: number;
  duration: number; // in hours
  shiftOptionId: string;
}

// Generation Types
export interface ScheduleGenerationParams {
  startDate: string;
  endDate: string;
  considerPreferences?: boolean;
  allowOvertime?: boolean;
  maxOvertimeHours?: number;
  schedulePeriodId: string;
}

export interface ScheduleGenerationResult {
  success: boolean;
  shiftsGenerated: number;
  unfilledRequirements: number;
  errors?: string[];
  warnings?: string[];
}

export interface GenerationContext {
  periodId: string;
  startDate: string;
  endDate: string;
  employees: Tables['employees']['Row'][];
  timeOffRequests: TimeOffRequest[];
  staffingRequirements: StaffingRequirement[];
  shiftOptions: ShiftOption[];
  params: ScheduleGenerationParams;
  weeklyHours: Record<string, number>;
  shiftPatterns: Record<string, ShiftPattern>;
  holidays: Holiday[];
}

// Validation Types
export interface ScheduleValidation {
  isValid: boolean;
  conflicts: SchedulingConflict[];
  warnings: string[];
  suggestions: string[];
}

export interface SchedulingConflict {
  id: string;
  type: ConflictType;
  severity: 'error' | 'warning';
  message: string;
  affectedShifts: string[];
  startTime: string;
  endTime: string;
  resolution?: ConflictResolution;
}

export type ConflictType = 'overlap' | 'pattern' | 'hours' | 'staffing' | 'supervisor' | 'rest';

export interface ConflictResolution {
  action: 'reassign' | 'adjust' | 'split' | 'delete';
  shiftId: string;
  newEmployeeId?: string;
  adjustedTime?: string;
}

// Supporting Types
export interface Holiday {
  date: string;
  name: string;
  isObserved: boolean;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'vacation' | 'sick' | 'personal';
  notes?: string;
}

export interface StaffingRequirement {
  id: string;
  timeSlot: TimeSlot;
  minTotalStaff: number;
  minSupervisors: number;
  startDate?: string;
  endDate?: string;
  dayOfWeek?: DayOfWeek;
  priority: number;
}

// Re-export database types
export type Employee = Tables['employees']['Row'];
export type EmployeeRole = Enums['employee_role']; 