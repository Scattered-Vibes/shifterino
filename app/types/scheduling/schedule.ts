import type { ID, ISO8601DateTime } from '../shared/common';
import type { Shift } from './shift';

export interface Schedule {
  id: ID;
  name: string;
  startDate: ISO8601DateTime;
  endDate: ISO8601DateTime;
  status: ScheduleStatus;
  description?: string;
  shifts: Shift[];
  isPublished: boolean;
  publishedAt?: ISO8601DateTime;
  lastModifiedBy: ID;
}

export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface ScheduleTemplate {
  id: ID;
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
  startDate: ISO8601DateTime;
  endDate: ISO8601DateTime;
  templateId?: ID;
  constraints: {
    maxHoursPerWeek: number;
    minRestHours: number;
    preferredShiftPatterns: boolean;
    balanceWorkload: boolean;
  };
} 