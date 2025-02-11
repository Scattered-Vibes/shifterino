import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters',
  }),
})

export const signupSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters',
  }),
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters',
  }),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters',
  }),
  role: z.enum(['dispatcher', 'supervisor', 'manager']),
})

export const resetPasswordSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters',
  }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema> 