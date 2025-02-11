export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  startHour: number;
  endHour: number;
  days: DayOfWeek[];
}

export interface SchedulingConstraints {
  maxHoursPerWeek: number;
  minHoursPerWeek: number;
  maxConsecutiveDays: number;
  minRestHoursBetweenShifts: number;
  requireSupervisorPresence: boolean;
}

export type ShiftPatternType = 'four_ten' | 'three_twelve_plus_four';

export interface ShiftPattern {
  type: ShiftPatternType;
  description: string;
  hoursPerWeek: number;
  shiftsPerWeek: number;
}

export interface Holiday {
  date: string;
  name: string;
  isRecurring: boolean;
}

export interface WeeklyHoursTracking {
  employeeId: string;
  weekStartDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface GenerationContext {
  holidays: Holiday[];
  timeOffRequests: Array<{
    employeeId: string;
    startDate: string;
    endDate: string;
  }>;
  preferences: Array<{
    employeeId: string;
    preferredShifts: string[];
  }>;
} 