import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['dispatcher', 'supervisor', 'manager'], {
    required_error: 'Please select a role',
  }),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Export auth types
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

// Common validation rules
const timeStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, {
  message: 'Invalid time format. Expected ISO 8601 format.'
})

const positiveNumber = z.number().positive({
  message: 'Value must be positive'
})

// Shift validation
export const shiftSchema = z.object({
  actual_start_time: timeStringSchema,
  actual_end_time: timeStringSchema,
  shift_option_id: z.string().uuid({
    message: 'Invalid shift option ID'
  }),
  actual_hours_worked: positiveNumber.max(24, {
    message: 'Shift duration cannot exceed 24 hours'
  })
}).refine(
  (data) => {
    const start = new Date(data.actual_start_time)
    const end = new Date(data.actual_end_time)
    return end > start
  },
  {
    message: 'End time must be after start time',
    path: ['actual_end_time']
  }
)

// Employee shift pattern validation
export const shiftPatternSchema = z.object({
  pattern_type: z.enum(['four_ten', 'three_twelve_plus_four'], {
    description: 'Must be either four 10-hour shifts or three 12-hour shifts plus one 4-hour shift'
  }),
  start_day: z.number().min(0).max(6),
  preferred_shift: z.enum(['day', 'swing', 'night'])
})

// Time-off request validation
export const timeOffRequestSchema = z.object({
  start_date: timeStringSchema,
  end_date: timeStringSchema,
  reason: z.string().min(1, 'Reason is required').max(500),
  type: z.enum(['vacation', 'sick', 'personal', 'other']),
  employee_id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending')
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return end >= start
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date']
  }
)

// Staffing requirement validation
export const staffingRequirementSchema = z.object({
  time_block: z.enum(['early_morning', 'day', 'evening', 'night']),
  min_staff: z.number().min(1),
  min_supervisors: z.number().min(1),
  day_of_week: z.number().min(0).max(6),
  is_holiday: z.boolean().default(false)
})

// Base schedule schema without refinements
const baseScheduleSchema = z.object({
  employee_id: z.string().uuid(),
  shift_pattern: shiftPatternSchema,
  start_date: timeStringSchema,
  end_date: timeStringSchema,
  is_supervisor: z.boolean(),
  status: z.enum(['draft', 'published', 'archived'])
})

// Schedule validation with refinements
export const scheduleSchema = baseScheduleSchema.refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    const fourMonths = 1000 * 60 * 60 * 24 * 30 * 4 // 4 months in milliseconds
    return end.getTime() - start.getTime() <= fourMonths
  },
  {
    message: 'Schedule duration cannot exceed 4 months',
    path: ['end_date']
  }
)

// Schedule update validation
export const scheduleUpdateSchema = baseScheduleSchema.partial().refine(
  (data) => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date)
      const end = new Date(data.end_date)
      const fourMonths = 1000 * 60 * 60 * 24 * 30 * 4
      return end.getTime() - start.getTime() <= fourMonths
    }
    return true
  },
  {
    message: 'Schedule duration cannot exceed 4 months',
    path: ['end_date']
  }
)

// Form input validation
export const shiftUpdateFormSchema = z.object({
  start_time: z.date(),
  end_time: z.date(),
  employee_id: z.string().uuid(),
  is_supervisor_shift: z.boolean().default(false),
  notes: z.string().max(500).optional()
}).refine(
  (data) => {
    const minDuration = 1000 * 60 * 60 * 4 // 4 hours in milliseconds
    const maxDuration = 1000 * 60 * 60 * 12 // 12 hours in milliseconds
    const duration = data.end_time.getTime() - data.start_time.getTime()
    return duration >= minDuration && duration <= maxDuration
  },
  {
    message: 'Shift duration must be between 4 and 12 hours',
    path: ['end_time']
  }
)

// Export types
export type ShiftFormData = z.infer<typeof shiftUpdateFormSchema>
export type TimeOffRequestFormData = z.infer<typeof timeOffRequestSchema>
export type ScheduleFormData = z.infer<typeof scheduleSchema>
export type StaffingRequirementFormData = z.infer<typeof staffingRequirementSchema> 