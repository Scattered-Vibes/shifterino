'use server'

import { getServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireManager } from '@/lib/auth/server'
import { handleError, ErrorCode } from '@/lib/utils/error-handler'
import type { 
  StaffingRequirement, 
  CreateStaffingRequirementInput, 
  UpdateStaffingRequirementInput 
} from '@/types/models/staffing'

export async function getStaffingRequirements() {
  await requireManager()
  const supabase = getServerClient()

  const { data: requirements, error } = await supabase
    .from('staffing_requirements')
    .select('*')
    .order('time_block_start')

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  return requirements as StaffingRequirement[]
}

export async function createRequirement(requirement: CreateStaffingRequirementInput) {
  await requireManager()
  const supabase = getServerClient()

  const { error } = await supabase
    .from('staffing_requirements')
    .insert(requirement)

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  revalidatePath('/requirements')
}

export async function updateRequirement(id: string, requirement: UpdateStaffingRequirementInput) {
  await requireManager()
  const supabase = getServerClient()

  const { error } = await supabase
    .from('staffing_requirements')
    .update(requirement)
    .eq('id', id)

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  revalidatePath('/requirements')
}

export async function deleteRequirement(id: string) {
  await requireManager()
  const supabase = getServerClient()

  const { error } = await supabase
    .from('staffing_requirements')
    .delete()
    .eq('id', id)

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR)
  }

  revalidatePath('/requirements')
} 