export type Duration = {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export type TimeBlock = {
  start: Date
  end: Date
}

export interface DateRange {
  start: Date
  end: Date
}

export type TimeRange = {
  start_time: string  // Format: "HH:mm"
  end_time: string    // Format: "HH:mm"
}

export type WeeklyTracking = {
  [key: string]: {
    [weekStartDate: string]: number
  }
}

export interface ValidationError {
  code: string
  message: string
  field?: string
}

export interface BaseConflict {
  type: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'

export interface TrackingPeriod {
  start_date: string
  end_date: string
  count: number
  total_hours: number
}

export interface StaffingTimeBlock extends TimeBlock {
  required_total: number
  required_supervisors: number
  actual_total: number
  actual_supervisors: number
}

export interface StaffingLevel {
  total: number
  supervisors: number
  hasSupervisor: boolean
  isSufficient: boolean
}

// Basic type aliases
export type ID = string;
export type ISO8601DateTime = string;
export type UUID = string;

// Common interfaces
export interface Timestamps {
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ValueOf<T> = T[keyof T];

// Error handling types
export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Date range type
export interface DateRange {
  startDate: ISO8601DateTime;
  endDate: ISO8601DateTime;
} 