import { z } from 'zod'

export const scheduleSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  shiftType: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
  notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
})

export const schedulePeriodSchema = z.object({
  name: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  status: z.enum(['draft', 'pending_approval', 'approved', 'published', 'archived']),
  is_published: z.boolean(),
  created_by: z.string().uuid(),
})

export const scheduleGenerationParamsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  considerPreferences: z.boolean().optional(),
  allowOvertime: z.boolean().optional(),
  maxOvertimeHours: z.number().min(0).max(40).optional(),
}) 