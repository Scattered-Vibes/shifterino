import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { AppError, ErrorCode } from '@/lib/utils/error-handler'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new AppError('Missing env.NEXT_PUBLIC_SUPABASE_URL', ErrorCode.INTERNAL_ERROR)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new AppError('Missing env.SUPABASE_SERVICE_ROLE_KEY', ErrorCode.INTERNAL_ERROR, 500)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create singleton admin client
let adminInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!adminInstance) {
    adminInstance = createClient<Database>(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return adminInstance
}

// Export singleton instance
export const supabaseAdmin = getSupabaseAdmin()

// Re-export types that might be needed by consumers
export type { Database } 