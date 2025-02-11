import type { GenerationContext } from './scheduling/common';

export type {
  // Common types
  DayOfWeek,
  TimeSlot,
  SchedulingConstraints,
  ShiftPatternType,
  ShiftPattern,
  Holiday,
  WeeklyHoursTracking,
  GenerationContext
} from './scheduling/common';

// Additional scheduling types
export interface OnCallActivation {
  id: string;
  assignmentId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface OnCallAssignment {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ScheduleGenerationParams {
  startDate: string;
  endDate: string;
  employeeIds: string[];
  requirements: Array<{
    timeSlot: {
      startHour: number;
      endHour: number;
      days: string[];
    };
    count: number;
  }>;
  context: GenerationContext;
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedule?: {
    id: string;
    shifts: Array<{
      employeeId: string;
      startTime: string;
      endTime: string;
    }>;
  };
  errors?: string[];
  warnings?: string[];
} 