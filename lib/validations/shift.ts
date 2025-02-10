import { z } from 'zod'

const baseShiftSchema = z.object({
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  employeeId: z.string({
    required_error: 'Employee is required',
  }),
  shiftOptionId: z.string({
    required_error: 'Shift option is required',
  }),
})

export const shiftSchema = baseShiftSchema.refine((data) => {
  return data.endTime > data.startTime
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export type ShiftFormData = z.infer<typeof shiftSchema>

export const shiftUpdateSchema = z.object({
  ...baseShiftSchema.shape,
  actual_start_time: z.string().datetime(),
  actual_end_time: z.string().datetime(),
  shift_option_id: z.string(),
  actual_hours_worked: z.number().min(0),
}).refine((data) => {
  return data.endTime > data.startTime
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export type ShiftUpdateFormData = z.infer<typeof shiftUpdateSchema> 