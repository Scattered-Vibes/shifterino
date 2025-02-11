import type { Timestamps } from '../shared/common';

// Re-export model types explicitly to avoid naming conflicts
export type {
  Employee,
  EmployeeBasic,
  EmployeeRole,
  EmployeeSchedulePreferences,
  EmployeeStats,
  EmployeeWithSchedule,
  EmployeeWithShifts,
  EmployeeAvailability
} from './employee';

export type {
  Schedule,
  SchedulePeriod,
  StaffingRequirement as DatabaseStaffingRequirement,
  ShiftPatternRule,
  ShiftPatternTracking,
  ScheduleGenerationConfig,
  ScheduleValidation,
  PatternViolation,
  ScheduleWithDetails,
  SchedulePeriodWithDetails,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleConflict,
  ScheduleWithShifts,
  ScheduleWithEmployees,
  ScheduleStats,
  StaffingGap,
  ScheduleTemplate
} from './schedule';

export type {
  IndividualShift,
  ShiftOption,
  ShiftEvent,
  ShiftSwapRequest,
  ShiftUpdateData,
  ShiftTemplate,
  ShiftWithEmployee,
  ShiftWithSchedule,
  ShiftValidation,
  ShiftConflict,
  ShiftCreate,
  ShiftStats
} from './shift';

export type {
  TimeOffRequest,
  TimeOffRequestWithDetails,
  TimeOffRequestCreate,
  TimeOffRequestUpdate
} from './time-off';

// Common model interfaces
export interface BaseModel extends Timestamps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeleteModel extends BaseModel {
  deletedAt?: string;
}

export interface AuditableModel extends BaseModel {
  createdBy: string;
  updatedBy: string;
} 