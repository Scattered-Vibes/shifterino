// Basic type aliases
export type ID = string
export type UUID = string
export type ISO8601DateTime = string
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ValueOf<T> = T[keyof T]

// Time-related types
export interface Duration {
  hours: number
  minutes: number
  seconds?: number
  milliseconds?: number
  days?: number
}

export interface TimeBlock {
  startTime: string  // Format: "HH:mm"
  endTime: string    // Format: "HH:mm"
}

export interface DateRange {
  startDate: ISO8601DateTime
  endDate: ISO8601DateTime
}

export interface TimeRange {
  startTime: ISO8601DateTime
  endTime: ISO8601DateTime
}

// Tracking types
export interface WeeklyTracking {
  [key: string]: {
    [weekStartDate: string]: number
  }
}

export interface TrackingPeriod {
  startDate: ISO8601DateTime
  endDate: ISO8601DateTime
  count: number
  totalHours: number
}

// Validation types
export interface ValidationError {
  code?: string
  message: string
  field?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: string[]
}

// Status and conflict types
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'archived'

export interface BaseConflict {
  type: string
  message: string
  details?: Record<string, unknown>
}

// Staffing types
export interface StaffingLevel {
  total: number
  supervisors: number
  hasSupervisor: boolean
  isSufficient: boolean
}

export interface StaffingTimeBlock extends TimeBlock {
  requiredTotal: number
  requiredSupervisors: number
  actualTotal: number
  actualSupervisors: number
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Error handling types
export interface ErrorResponse {
  message: string
  code: string
  details?: Record<string, unknown>
}

// Base model interfaces
export interface Timestamps {
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
} 