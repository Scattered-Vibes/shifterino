import type { ID, ISO8601DateTime } from '../shared/common';
import type { Shift } from './shift';

export type ConflictType = 
  | 'overtime'
  | 'insufficient_rest'
  | 'double_booking'
  | 'time_off'
  | 'availability'
  | 'supervisor_required'
  | 'understaffed';

export interface SchedulingConflict {
  id: ID;
  type: ConflictType;
  severity: 'error' | 'warning';
  message: string;
  affectedShifts: Shift[];
  startTime: ISO8601DateTime;
  endTime: ISO8601DateTime;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  type: 'override' | 'adjust' | 'remove';
  resolvedBy: ID;
  resolvedAt: ISO8601DateTime;
  notes?: string;
}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: SchedulingConflict[];
  canPublish: boolean;
  requiredResolutions: number;
}

export interface ScheduleValidation {
  isValid: boolean;
  conflicts: SchedulingConflict[];
  warnings: string[];
  suggestions: string[];
}