/**
 * Service-level Supabase Client
 * 
 * This module provides a Supabase client configured with the service role key
 * for administrative operations. This should ONLY be used in server-side code
 * that requires elevated privileges.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
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

type Tables = Database['public']['Tables'];
type IndividualShift = Tables['individual_shifts']['Row'];
type TimeOffRequest = Tables['time_off_requests']['Row'];

type ShiftUpdateData = {
  actual_start_time?: string | null;
  actual_end_time?: string | null;
};

type TimeOffRequestData = {
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
};

export async function getEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient();
  return supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate);
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  const supabase = createClient();
  return supabase
    .from('individual_shifts')
    .update(data)
    .eq('id', id)
    .single();
}

export async function createTimeOffRequest(data: TimeOffRequestData) {
  const supabase = createClient();
  return supabase
    .from('time_off_requests')
    .insert([data])
    .single();
} 