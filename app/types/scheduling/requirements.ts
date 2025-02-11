import type { ID, ISO8601DateTime } from '../shared/common';
import type { TimeSlot } from './common';

export interface StaffingRequirement {
  id: ID;
  timeSlot: TimeSlot;
  minEmployees: number;
  minSupervisors: number;
  notes?: string;
}

export interface StaffingLevel {
  timestamp: ISO8601DateTime;
  actualCount: number;
  requiredCount: number;
  supervisorCount: number;
  isSufficient: boolean;
}

export interface CoverageGap {
  startTime: ISO8601DateTime;
  endTime: ISO8601DateTime;
  shortageAmount: number;
  requiresSupervisor: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface StaffingOverride {
  id: ID;
  date: ISO8601DateTime;
  timeSlot: TimeSlot;
  adjustedMinEmployees?: number;
  adjustedMinSupervisors?: number;
  reason: string;
} 