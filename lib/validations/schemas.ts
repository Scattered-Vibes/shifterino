import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  role: z.enum(['dispatcher', 'supervisor', 'manager'], {
    required_error: 'Please select a role'
  })
})

export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['dispatcher', 'supervisor', 'manager']),
  shift_pattern: z.enum(['pattern_a', 'pattern_b']),
  preferred_shift_category: z.enum(['day', 'swing', 'graveyard'])
})

export const timeOffRequestSchema = z.object({
  start_date: z.date({
    required_error: 'Start date is required'
  }),
  end_date: z.date({
    required_error: 'End date is required'
  }),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional()
}).refine(data => {
  return data.end_date >= data.start_date
}, {
  message: 'End date must be after start date',
  path: ['end_date']
})

export const scheduleSchema = z.object({
  employee_id: z.string().uuid(),
  start_date: z.date(),
  end_date: z.date(),
  shift_type: z.enum(['day_early', 'day', 'swing', 'graveyard']),
  is_supervisor: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
}).refine(data => {
  return data.end_date >= data.start_date
}, {
  message: 'End date must be after start date',
  path: ['end_date']
})

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type TimeOffRequestInput = z.infer<typeof timeOffRequestSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema> 