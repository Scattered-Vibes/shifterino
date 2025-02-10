import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user and verify admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      return createErrorResponse(authError.message, 401)
    }

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return createErrorResponse(profileError.message, 500)
    }

    if (profile?.role !== 'admin') {
      return createErrorResponse('Forbidden - Admin access required', 403)
    }

    // Get all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*, users:auth.users(email, created_at)')

    if (usersError) {
      return createErrorResponse(usersError.message, 500)
    }

    return Response.json({ users })
  } catch (error) {
    console.error('Admin API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user and verify admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      return createErrorResponse(authError.message, 401)
    }

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return createErrorResponse(profileError.message, 500)
    }

    if (profile?.role !== 'admin') {
      return createErrorResponse('Forbidden - Admin access required', 403)
    }

    // Parse request body
    const body = await request.json()
    if (!body.email || !body.role) {
      return createErrorResponse('Missing required fields: email, role', 400)
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || Math.random().toString(36).slice(-8),
      email_confirm: true
    })

    if (createError) {
      return createErrorResponse(createError.message, 500)
    }

    // Create profile for new user
    const { error: profileCreateError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        role: body.role,
        full_name: body.full_name || null
      })

    if (profileCreateError) {
      // Attempt to clean up user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return createErrorResponse(profileCreateError.message, 500)
    }

    return Response.json({ user: newUser.user })
  } catch (error) {
    console.error('Admin API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 