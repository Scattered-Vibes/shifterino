/**
 * Regular Supabase operations that don't require service role access.
 * These operations use the standard client with RLS policies.
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'

// Database table types
type Tables = Database['public']['Tables']
type ShiftSwapRequest = Tables['shift_swap_requests']['Row']
type TimeOffRequest = Tables['time_off_requests']['Row']
type Employee = Tables['employees']['Row']
type IndividualShift = Tables['individual_shifts']['Row']
type ShiftOption = Tables['shift_options']['Row']

// Export the client for use in data access functions
export { supabase }

// Export types
export type {
  Tables,
  ShiftSwapRequest,
  TimeOffRequest,
  Employee,
  IndividualShift,
  ShiftOption
}

// Re-export Database type for consumers that need it
export type { Database } 