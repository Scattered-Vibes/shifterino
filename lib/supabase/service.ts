/**
 * Service Role Supabase Client Configuration
 * 
 * This module provides a Supabase client configured with service role credentials
 * for administrative and background tasks that require elevated database privileges.
 * The service role bypasses Row Level Security (RLS) policies.
 * 
 * IMPORTANT: This client should only be used server-side and never exposed to the client.
 * The service role key has full database access and must be kept secure.
 * 
 * Features:
 * - Full database access with service role credentials
 * - Bypasses RLS policies for administrative operations
 * - Stateless configuration without session management
 * - For use in server-side operations only
 * 
 * @module lib/supabase/service
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Creates and configures a Supabase client with service role credentials
 * 
 * @returns {SupabaseClient} Configured Supabase client with service role access
 * @throws {Error} If environment variables are not properly configured
 * 
 * @example
 * ```ts
 * // Server-side only
 * const serviceClient = createServiceClient()
 * const { data } = await serviceClient.from('table').select('*') // Bypasses RLS
 * ```
 */
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false, // No token refresh needed for service role
        persistSession: false    // No session persistence for stateless operations
      }
    }
  )
} 