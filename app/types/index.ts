import type { Database } from '@/types/supabase/database'

// Database types and enums
export type { Database } from '@/types/supabase/database'

// Database Enums
export type EmployeeRole = Database['public']['Enums']['employee_role']
export type ShiftCategory = Database['public']['Enums']['shift_category']
export type ShiftPattern = Database['public']['Enums']['shift_pattern']
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type TimeOffStatus = Database['public']['Enums']['time_off_status']
export type LogSeverity = Database['public']['Enums']['log_severity']

// Re-export all common types
export * from './shared/common'

// Model types
export type {
  // Employee
  Employee,
  EmployeeBasic,
  EmployeeSchedulePreferences,
  EmployeeStats,
  EmployeeWithSchedule,
  EmployeeWithShifts,
  EmployeeAvailability,
  
  // Schedule
  Schedule,
  SchedulePeriod,
  DatabaseStaffingRequirement,
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
  
  // Shift
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
  
  // Time off
  TimeOffRequest,
  TimeOffRequestWithDetails,
  TimeOffRequestCreate,
  TimeOffRequestUpdate,
  
  // Base models
  BaseModel,
  SoftDeleteModel,
  AuditableModel
} from './models'

// Scheduling types
export type {
  Holiday,
  WeeklyHoursTracking,
  GenerationContext,
  OnCallActivation,
  OnCallAssignment,
  ScheduleGenerationParams,
  ScheduleGenerationResult,
  TimeSlot,
  DayOfWeek,
  SchedulingConstraints,
  ShiftPatternType
} from './scheduling'

// API types
export type {
  ApiResponse,
  ApiError,
  RouteHandlerResponse,
  ApiStatusCode,
  ApiQueryParams
} from './api'

// Form types
export type {
  FormState,
  FormAction,
  ValidationRule,
  ValidationRules,
  SubmitOptions
} from './forms'

// Auth types
export type {
  AuthenticatedUser,
  AuthError
} from './auth'

// Realtime types
export type {
  AllowedTables,
  RealtimePayload,
  RealtimeSubscriptionOptions
} from './realtime'

// Error codes
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