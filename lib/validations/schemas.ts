import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export type LoginInput = z.infer<typeof loginSchema>

// Employee schemas
export const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['dispatcher', 'supervisor', 'manager'] as const),
  shift_pattern: z.enum(['pattern_a', 'pattern_b', 'custom'] as const),
  preferred_shift_category: z.enum(['early', 'day', 'swing', 'graveyard'] as const).nullable(),
  max_overtime_hours: z.number().min(0).max(40).nullable(),
  weekly_hours_cap: z.number().min(20).max(60)
})

export const employeeCreateSchema = employeeSchema.extend({
  auth_id: z.string().min(1)
})

export const employeeUpdateSchema = employeeSchema.partial()

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