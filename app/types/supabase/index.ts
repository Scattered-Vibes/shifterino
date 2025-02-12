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
export type EmployeeRole = Database['public']['Enums']['employee_role']
export type ShiftPattern = Database['public']['Enums']['shift_pattern']
export type ShiftCategory = Database['public']['Enums']['shift_category']
export type ShiftStatus = Database['public']['Enums']['shift_status']
export type TimeOffStatus = Database['public']['Enums']['time_off_status']

// Supabase specific types
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

// Auth types
export interface AuthUser {
  id: string
  email?: string
  role: string
  metadata: Record<string, unknown>
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

// Realtime types
export interface RealtimeChannel {
  subscribe: (callback: (payload: unknown) => void) => void
  unsubscribe: () => void
}

export interface RealtimeClient {
  channel: (name: string) => RealtimeChannel
  disconnect: () => void
}

// Database operation types
export type DBResult<T> = {
  data: T
  error: null
} | {
  data: null
  error: Error
}

export type DBQueryResult<T> = Promise<DBResult<T>>

// Table specific types
export type EmployeeRow = Tables['employees']['Row']
export type ShiftOptionRow = Tables['shift_options']['Row']
export type ScheduleRow = Tables['schedules']['Row']
export type TimeOffRequestRow = Tables['time_off_requests']['Row']
export type StaffingRequirementRow = Tables['staffing_requirements']['Row']
export type ShiftSwapRequestRow = Tables['shift_swap_requests']['Row']
export type OnCallAssignmentRow = Tables['on_call_assignments']['Row']
export type OnCallActivationRow = Tables['on_call_activations']['Row']
export type AuditLogRow = Tables['audit_logs']['Row'] 