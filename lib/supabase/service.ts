/**
 * Service-level Supabase Client
 * 
 * This module provides a Supabase client configured with the service role key
 * for administrative operations. This should ONLY be used in server-side code
 * that requires elevated privileges.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import config from '@/lib/config.server'
import { handleError } from '@/lib/utils/error-handler'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let serviceClient: SupabaseClient<Database> | null = null

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

  serviceClient = createSupabaseClient<Database>(url, serviceKey)
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

// Admin-only helper functions that require service role access
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

// Regular operations that don't require service role - moved to separate file
export type { Database } from '@/types/supabase'

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
  const supabase = createSupabaseClient<Database>();
  return supabase
    .from('individual_shifts')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate);
}

export async function updateShift(id: string, data: ShiftUpdateData) {
  const supabase = createSupabaseClient<Database>();
  return supabase
    .from('individual_shifts')
    .update(data)
    .eq('id', id)
    .single();
}

export async function createTimeOffRequest(data: TimeOffRequestData) {
  const supabase = createSupabaseClient<Database>();
  return supabase
    .from('time_off_requests')
    .insert([data])
    .single();
} 