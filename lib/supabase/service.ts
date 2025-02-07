/**
 * Service-level Supabase Client
 * 
 * This module provides a Supabase client configured with the service role key
 * for administrative operations. This should ONLY be used in server-side code
 * that requires elevated privileges.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import config from '@/lib/config.server'
import { handleError } from '@/lib/utils/error-handler'

// Type for the service client to ensure it's used correctly
type ServiceClient = ReturnType<typeof createClient<Database>>

// Service client configuration
const serviceConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-client-info': 'supabase-service'
    }
  }
} as const

let serviceClient: ServiceClient | null = null

/**
 * Creates and returns a Supabase client with service role privileges.
 * This should ONLY be used in server-side code that requires admin access.
 */
export function getServiceClient() {
  if (serviceClient) return serviceClient

  const { url, serviceKey } = config.supabase
    
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service configuration')
  }

  serviceClient = createClient<Database>(url, serviceKey, serviceConfig)
  return serviceClient
}

/**
 * Helper to ensure we're using the service client with proper error handling
 */
export function requireServiceClient() {
  try {
    const client = getServiceClient()
    if (!client) {
      throw new Error('Service client not initialized')
    }
    return client
  } catch (error) {
    throw handleError(error)
  }
}

// Admin-only helper functions
export const adminHelpers = {
  async deleteUser(userId: string) {
    try {
      const supabase = requireServiceClient()
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      return { error: handleError(error) }
    }
  },

  async getUserById(userId: string) {
    try {
      const supabase = requireServiceClient()
      const { data, error } = await supabase.auth.admin.getUserById(userId)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  },

  async listUsers() {
    try {
      const supabase = requireServiceClient()
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: handleError(error) }
    }
  }
} 