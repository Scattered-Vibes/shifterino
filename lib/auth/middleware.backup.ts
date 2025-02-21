import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase/database'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

type Employee = Database['public']['Tables']['employees']['Row']
type EmployeeRole = Employee['role']
type TableName = keyof Database['public']['Tables']

// Initialize rate limiter
const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '5 m'),
  analytics: true,
})

// Role hierarchy for access control
const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  'dispatcher': 1,
  'supervisor': 2,
  'manager': 3,
}

class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = 'UNAUTHORIZED'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await rateLimit.limit(identifier)
  
  if (!success) {
    throw new AuthError('Too many requests', 429, 'RATE_LIMITED')
  }
  
  return { limit, reset, remaining }
}

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new AuthError('Error getting user: ' + error.message)
  }
  
  if (!user) {
    throw new AuthError('No authenticated user found')
  }
  
  return user
}

function hasRequiredRole(userRole: EmployeeRole, requiredRole: EmployeeRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export async function requireAuth() {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'
  await checkRateLimit(`auth_${ip}`)

  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(requiredRole: EmployeeRole) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: employee, error } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (error) {
    throw new AuthError(`Error fetching employee role: ${error.message}`)
  }

  if (!employee || !hasRequiredRole(employee.role, requiredRole)) {
    throw new AuthError('Insufficient permissions', 403, 'FORBIDDEN')
  }

  return employee
}

export async function requireSupervisorOrAbove() {
  return requireRole('supervisor')
}

export async function requireManager() {
  return requireRole('manager')
}

// Utility function to validate access to specific resources
export async function validateResourceAccess(
  resourceId: string,
  tableName: TableName,
  requiredRole: EmployeeRole = 'dispatcher'
) {
  const user = await requireAuth()
  const supabase = await createClient()

  // First check user's role
  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !hasRequiredRole(employee.role, requiredRole)) {
    throw new AuthError('Insufficient permissions', 403, 'FORBIDDEN')
  }

  // Then check resource ownership/access
  const { data: resource, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', resourceId)
    .single()

  if (error || !resource) {
    throw new AuthError('Resource not found or access denied', 404, 'NOT_FOUND')
  }

  return { user, employee, resource }
} 