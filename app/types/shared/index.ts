export * from './common';

// Re-export essential shared types explicitly to avoid ambiguity
export type {
  ID,
  UUID,
  ISO8601DateTime,
  Timestamps,
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
  PaginatedResponse
} from './common'; 