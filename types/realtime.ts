import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from './supabase/database'
import type {
  IndividualShift,
  ShiftSwapRequest
} from './models/shift'
import type {
  TimeOffRequest
} from './models/time-off'
import type {
  Employee
} from './models/employee'

type Tables = Database['public']['Tables']

// Table Names
export type TableName = keyof Database['public']['Tables']

// Realtime Channel Types
export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

// Change Event Types
export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

// Generic Change Handler Type
export type ChangeHandler<T extends TableName> = {
  onInsert?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void
}

// Specific Table Change Handlers
export type ShiftChangeHandler = ChangeHandler<'individual_shifts'>
export type ShiftSwapChangeHandler = ChangeHandler<'shift_swap_requests'>
export type TimeOffChangeHandler = ChangeHandler<'time_off_requests'>
export type EmployeeChangeHandler = ChangeHandler<'employees'>
export type ScheduleChangeHandler = ChangeHandler<'schedules'>

// Subscription Options
export interface SubscriptionOptions {
  event?: ChangeEvent
  filter?: string
  schema?: string
}

// Realtime Manager Types
export interface RealtimeManager {
  subscribe: <T extends TableName>(
    table: T,
    handler: ChangeHandler<T>,
    options?: SubscriptionOptions
  ) => RealtimeSubscription
  
  unsubscribe: (subscription: RealtimeSubscription) => void
}

// Specific Table Subscriptions
export interface ShiftSubscription extends RealtimeSubscription {
  data?: IndividualShift[]
}

export interface ShiftSwapSubscription extends RealtimeSubscription {
  data?: ShiftSwapRequest[]
}

export interface TimeOffSubscription extends RealtimeSubscription {
  data?: TimeOffRequest[]
}

export interface EmployeeSubscription extends RealtimeSubscription {
  data?: Employee[]
}

// Realtime Hook Types
export interface UseRealtimeSubscriptionProps<T extends TableName> {
  table: T
  handler: ChangeHandler<T>
  options?: SubscriptionOptions
  enabled?: boolean
}

// Realtime State Types
export interface RealtimeState<T> {
  data: T[]
  isLoading: boolean
  error: Error | null
}

// Realtime Action Types
export type RealtimeAction<T> =
  | { type: 'SET_DATA'; payload: T[] }
  | { type: 'ADD_DATA'; payload: T }
  | { type: 'UPDATE_DATA'; payload: T }
  | { type: 'REMOVE_DATA'; payload: { id: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }

// Realtime Context Types
export interface RealtimeContextType {
  subscribe: <T extends TableName>(
    table: T,
    handler: ChangeHandler<T>,
    options?: SubscriptionOptions
  ) => RealtimeSubscription
  unsubscribe: (subscription: RealtimeSubscription) => void
}

// Utility Types
export interface RealtimeError extends Error {
  code: string
  details?: unknown
}

export interface RealtimeStats {
  connected_clients: number
  subscribed_channels: number
  messages_sent: number
  messages_received: number
} 