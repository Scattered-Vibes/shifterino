import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from './database'

export type AllowedTables =
  | 'schedules'
  | 'schedule_periods'
  | 'staffing_requirements'
  | 'shift_pattern_rules'
  | 'individual_shifts'
  | 'employees'
  | 'auth_logs'
  | 'shift_options'
  | 'profiles'
  | 'scheduling_logs'
  | 'shifts'
  | 'shift_swap_requests'
  | 'on_call_assignments'
  | 'on_call_activations'
  | 'time_off_requests'

export type RealtimePayload = RealtimePostgresChangesPayload<Database['public']['Tables']>

export interface RealtimeSubscriptionOptions {
  table: AllowedTables
  schema?: string
  filter?: string
} 