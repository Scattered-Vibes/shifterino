import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/index'
import { createApiResponse, handleApiError, requireAuth } from '@/lib/api/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().optional(),
  role: z.enum(['admin', 'manager', 'supervisor', 'employee']),
  full_name: z.string().optional()
})

export async function GET(_request: NextRequest) {
  try {
    await requireAuth('admin')
    const supabase = createServerClient()

    // Get all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*, users:auth.users(email, created_at)')

    if (usersError) throw usersError

    return createApiResponse({ users })
  } catch (error) {
    return handleApiError(error, 'get users')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin')
    const supabase = createServerClient()

    // Parse and validate request body
    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password || Math.random().toString(36).slice(-8),
      email_confirm: true
    })

    if (createError) throw createError

    // Create profile for new user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        role: data.role,
        full_name: data.full_name || null
      })

    if (profileError) {
      // Attempt to clean up user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id)
      throw profileError
    }

    return createApiResponse({ user: newUser.user })
  } catch (error) {
    return handleApiError(error, 'create user')
  }
} 