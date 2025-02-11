export interface Schedule {
  id: string;
  employeeId: string;
  shiftId: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleResponse {
  success: boolean;
  data?: Schedule;
  error?: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  patternDuration: number; // in days
  shifts: TemplateShift[];
}

export interface TemplateShift {
  dayOffset: number; // 0-based day number in the pattern
  startHour: number; // 0-23
  duration: number; // in hours
  requiredRole: string;
  isSupervised: boolean;
}

export interface ScheduleGenerationOptions {
  startDate: string;
  endDate: string;
  timeZone?: string;
  constraints: {
    maxHoursPerWeek: number;
    minRestHours: number;
    preferredShiftPatterns: boolean;
    balanceWorkload: boolean;
  };
}

export interface StaffingRequirement {
  id: string;
  timeSlotId: string;
  minTotalStaff: number;
  minSupervisors: number;
  preferredRoles?: string[];
  priority: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  daysOfWeek: number[]; // 0-6, where 0 is Sunday
}

export interface ShiftPattern {
  id: string;
  name: string;
  description?: string;
  shifts: {
    dayOffset: number;
    duration: number; // in hours
  }[];
  totalHours: number;
  daysInPattern: number;
} 