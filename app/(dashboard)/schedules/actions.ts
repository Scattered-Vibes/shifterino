'use server';

import { createClient } from '@/lib/supabase/server';
import { ScheduleGenerationParams } from '@/types/models/schedule';
import { Database } from '@/types/supabase/database';
import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/supabase/server';
import { handleError, ErrorCode } from '@/lib/utils/error-handler';

type Tables = Database['public']['Tables'];

export async function generateSchedule(params: ScheduleGenerationParams) {
  const supabase = createClient();

  try {
    const { data: schedule, error } = await supabase.rpc('generate_schedule', params);

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true, data: schedule };
  } catch (error) {
    console.error('Error generating schedule:', error);
    return { success: false, error: 'Failed to generate schedule' };
  }
}

export async function validateSchedule(scheduleId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('validate_schedule', {
      p_schedule_id: scheduleId,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error validating schedule:', error);
    return { success: false, error: 'Failed to validate schedule' };
  }
}

export async function publishSchedule(scheduleId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('schedules')
      .update({ is_published: true })
      .eq('id', scheduleId);

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true };
  } catch (error) {
    console.error('Error publishing schedule:', error);
    return { success: false, error: 'Failed to publish schedule' };
  }
}

export async function assignShift(employeeId: string, shiftOptionId: string, date: string) {
  const supabase = createClient();

  try {
    // First check if employee already has a shift on this date
    const { data: existingShift, error: checkError } = await supabase
      .from('individual_shifts')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('date', date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingShift) {
      return {
        success: false,
        error: 'Employee already has a shift assigned on this date',
      };
    }

    // Assign the new shift
    const { error } = await supabase
      .from('individual_shifts')
      .insert({
        employee_id: employeeId,
        shift_option_id: shiftOptionId,
        date,
        status: 'scheduled',
      } satisfies Tables['individual_shifts']['Insert']);

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true };
  } catch (error) {
    console.error('Error assigning shift:', error);
    return { success: false, error: 'Failed to assign shift' };
  }
}

export async function removeShift(shiftId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('individual_shifts')
      .delete()
      .eq('id', shiftId);

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true };
  } catch (error) {
    console.error('Error removing shift:', error);
    return { success: false, error: 'Failed to remove shift' };
  }
}

export async function getSchedules() {
  const supabase = getServerClient();
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    throw handleError(error, ErrorCode.DATABASE_ERROR);
  }

  return schedules;
} 