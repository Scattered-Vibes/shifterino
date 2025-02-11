// Common scheduling types
export type {
  DayOfWeek,
  TimeSlot,
  SchedulingConstraints,
  ShiftPatternType,
  ShiftPattern,
  Holiday,
  WeeklyHoursTracking,
  GenerationContext
} from './common';

// Re-export scheduling types with explicit naming
export type {
  Shift,
  ShiftType,
  ShiftStatus,
  ShiftSwapRequest,
  ShiftSwapStatus,
  ShiftPreference
} from './shift';

export type {
  Schedule,
  ScheduleStatus,
  ScheduleTemplate,
  TemplateShift,
  ScheduleGenerationOptions
} from './schedule';

export type {
  StaffingRequirement,
  StaffingLevel,
  CoverageGap,
  StaffingOverride
} from './requirements';

export type {
  ConflictType,
  SchedulingConflict,
  ConflictResolution,
  ConflictCheck,
  ScheduleValidation
} from './conflicts'; 