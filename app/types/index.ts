import type { Database } from '@/types/supabase/database'

// Re-export database types
export type { Database } from '@/types/supabase/database'

// Re-export database enums with aliases
export type EmployeeRole = Database['public']['Enums']['employee_role']
export type ShiftCategory = Database['public']['Enums']['shift_category']
export type ShiftPattern = Database['public']['Enums']['shift_pattern']
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type TimeOffStatus = Database['public']['Enums']['time_off_status']
export type LogSeverity = Database['public']['Enums']['log_severity']

// Re-export shared/common types
export type {
  Duration,
  TimeBlock,
  DateRange,
  TimeRange,
  WeeklyTracking,
  ValidationError,
  BaseConflict,
  ValidationResult,
  Status,
  TrackingPeriod,
  StaffingTimeBlock,
  StaffingLevel,
  PaginationParams,
  PaginatedResponse,
  // Common type aliases
  ID,
  UUID,
  ISO8601DateTime
} from './shared'

// Re-export model types
export type {
  Employee,
  EmployeeBasic,
  EmployeeSchedulePreferences,
  EmployeeStats,
  EmployeeWithSchedule,
  EmployeeWithShifts,
  EmployeeAvailability,
  DatabaseStaffingRequirement,
  Schedule,
  SchedulePeriod,
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
  ScheduleTemplate,
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
  ShiftStats,
  TimeOffRequest,
  TimeOffRequestWithDetails,
  TimeOffRequestCreate,
  TimeOffRequestUpdate,
  BaseModel,
  SoftDeleteModel,
  AuditableModel
} from './models'

// Re-export scheduling types
export type {
  Holiday,
  WeeklyHoursTracking,
  GenerationContext,
  OnCallActivation,
  OnCallAssignment,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  SchedulingStaffingRequirement,
  SchedulingValidation,
  TimeSlot,
  DayOfWeek,
  SchedulingConstraints,
  ShiftPatternType
} from './scheduling'

// Re-export API types
export type {
  ApiResponse,
  ApiError as ApiResponseError,
  RouteHandlerResponse,
  ApiStatusCode,
  ApiQueryParams
} from './api'

// Re-export form types
export type {
  FormState,
  FormAction,
  ValidationRule,
  ValidationRules,
  SubmitOptions
} from './forms'

// Re-export auth types
export type { AuthenticatedUser, AuthError } from './auth'

// Re-export realtime types
export type {
  AllowedTables,
  RealtimePayload,
  RealtimeSubscriptionOptions
} from './realtime'

// Error Types
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DB_ERROR: 'DB_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR'
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

export interface ApiError {
  code: ErrorCode
  message: string
  details?: unknown
}

// Main barrel file for type exports
export * from './auth';
export * from './models';
export * from './api';
export * from './scheduling';
export * from './shared';
export * from './supabase';
export * from './realtime';
export * from './forms';
export * from './routes';

// Re-export common types
export type ID = string;
export type UUID = string;
export type ISO8601DateTime = string; 