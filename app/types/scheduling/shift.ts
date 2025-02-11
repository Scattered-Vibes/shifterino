import type { ID, ISO8601DateTime } from '../shared/common';

export interface Shift {
  id: ID;
  scheduleId: ID;
  employeeId: ID;
  startTime: ISO8601DateTime;
  endTime: ISO8601DateTime;
  type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  isOvertime: boolean;
  supervisorId?: ID;
}

export type ShiftType = 'regular' | 'overtime' | 'training';
export type ShiftStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface ShiftSwapRequest {
  id: ID;
  requestingEmployeeId: ID;
  requestedEmployeeId: ID;
  shiftId: ID;
  status: ShiftSwapStatus;
  notes?: string;
}

export type ShiftSwapStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export interface ShiftPreference {
  employeeId: ID;
  preferredShiftType: ShiftType[];
  preferredDays: string[];
  preferredHours: {
    start: number;
    end: number;
  };
  blackoutDates: ISO8601DateTime[];
} 