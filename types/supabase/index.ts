import type { Database } from './database'

// Database type exports
export type { Database } from './database'

// Table types
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Helper types for table operations
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Enum types from database
export type EmployeeRole = Enums['employee_role']
export type ShiftPattern = Enums['shift_pattern']
export type ShiftCategory = Enums['shift_category']
export type ShiftStatus = Enums['shift_status']
export type TimeOffStatus = Enums['time_off_status']
export type LogSeverity = Enums['log_severity']

// Supabase specific types
export interface SupabaseConfig {
  auth?: {
    autoRefreshToken?: boolean
    persistSession?: boolean
    detectSessionInUrl?: boolean
    flowType?: 'implicit' | 'pkce'
  }
  global?: {
    headers?: Record<string, string>
  }
  cookies?: {
    name?: string
    lifetime?: number
    domain?: string
    sameSite?: 'lax' | 'strict' | 'none'
    secure?: boolean
  }
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  role: EmployeeRole
  employee_id?: string
  metadata: {
    first_name?: string
    last_name?: string
    shift_pattern?: ShiftPattern
  }
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

// Realtime types
export interface RealtimePayload<T = unknown> {
  new: T
  old: T | null
  errors: null | Error[]
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  schema: string
  table: string
}

export interface RealtimeChannel {
  subscribe: <T>(callback: (payload: RealtimePayload<T>) => void) => void
  unsubscribe: () => void
  on: <T>(
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    callback: (payload: RealtimePayload<T>) => void
  ) => RealtimeChannel
}

export interface RealtimeClient {
  channel: (name: string) => RealtimeChannel
  on: <T>(event: string, callback: (payload: T) => void) => void
  disconnect: () => void
}

// Database operation types
export type DBResult<T> = {
  data: T
  error: null
  status: number
  statusText: string
} | {
  data: null
  error: {
    message: string
    details: string
    hint?: string
    code: string
  }
  status: number
  statusText: string
}

export type DBQueryResult<T> = Promise<DBResult<T>>

// Table specific types
export type EmployeeRow = TableRow<'employees'>
export type ShiftOptionRow = TableRow<'shift_options'>
export type ScheduleRow = TableRow<'schedules'>
export type TimeOffRequestRow = TableRow<'time_off_requests'>
export type StaffingRequirementRow = TableRow<'staffing_requirements'>
export type ShiftSwapRequestRow = TableRow<'shift_swap_requests'>
export type IndividualShiftRow = TableRow<'individual_shifts'>
export type SchedulingLogRow = TableRow<'scheduling_logs'>
export type ShiftPatternRuleRow = TableRow<'shift_pattern_rules'>
export type SystemSettingRow = TableRow<'system_settings'>

// Join types
export interface EmployeeWithShifts extends EmployeeRow {
  shifts: IndividualShiftRow[]
}

export interface ShiftWithEmployee extends IndividualShiftRow {
  employee: EmployeeRow
  shift_option: ShiftOptionRow
}

// Utility types
export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

export type WithOptionalTimestamps<T> = T & {
  created_at?: string
  updated_at?: string
}

// Error types
export interface SupabaseError extends Error {
  code: string
  details: string
  hint?: string
  message: string
}

export type ErrorWithContext = {
  error: SupabaseError
  context: {
    operation: string
    table?: string
    data?: unknown
  }
} 