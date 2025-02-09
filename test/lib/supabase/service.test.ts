import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '@/test/utils/supabase-mock';
import { getEmployeeSchedule, updateShift, createTimeOffRequest } from '@/lib/supabase/service';
import type { Database } from '@/types/database';

describe('Supabase Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  describe('getEmployeeSchedule', () => {
    it('should fetch employee schedule', async () => {
      const employeeId = '123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      await getEmployeeSchedule(employeeId, startDate, endDate);

      expect(mockSupabase.getLastTableName()).toBe('individual_shifts');
      expect(mockSupabase.from('individual_shifts').getCalls()).toEqual([
        { method: 'select', args: ['*'] },
        { method: 'eq', args: ['employee_id', employeeId] },
        { method: 'gte', args: ['date', startDate] },
        { method: 'lte', args: ['date', endDate] }
      ]);
    });
  });

  describe('updateShift', () => {
    it('should update shift details', async () => {
      const shiftId = '123';
      const updateData = {
        actual_start_time: '2024-01-01T09:00:00Z',
        actual_end_time: '2024-01-01T17:00:00Z'
      };

      await updateShift(shiftId, updateData);

      expect(mockSupabase.getLastTableName()).toBe('individual_shifts');
      expect(mockSupabase.from('individual_shifts').getCalls()).toEqual([
        { method: 'update', args: [updateData] },
        { method: 'eq', args: ['id', shiftId] }
      ]);
    });
  });

  describe('createTimeOffRequest', () => {
    it('should create a time off request', async () => {
      const request = {
        employee_id: '123',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        reason: 'Vacation'
      };

      await createTimeOffRequest(request);

      expect(mockSupabase.getLastTableName()).toBe('time_off_requests');
      expect(mockSupabase.from('time_off_requests').getCalls()).toEqual([
        { method: 'insert', args: [[request]] }
      ]);
    });
  });

  it('should handle successful data fetch', async () => {
    const mockData: Database['public']['Tables']['employees']['Row'] = {
      id: '1',
      auth_id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'dispatcher',
      shift_pattern: 'pattern_a',
      preferred_shift_category: 'day',
      weekly_hours_cap: 40,
      max_overtime_hours: 10,
      last_shift_date: null,
      total_hours_current_week: 0,
      consecutive_shifts_count: 0,
      created_by: '123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      weekly_hours: 40
    };
    mockSupabase.mockSuccess(mockData);

    const result = await mockSupabase
      .from('employees')
      .select()
      .eq('id', '1')
      .single();

    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.getLastTableName()).toBe('employees');
  });

  it('should handle error states', async () => {
    const mockError = new Error('Database error');
    mockSupabase.mockError(mockError);

    const result = await mockSupabase
      .from('employees')
      .select()
      .eq('id', '1')
      .single();

    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
    expect(mockSupabase.getLastTableName()).toBe('employees');
  });

  it('should handle realtime subscriptions', () => {
    const mockCallback = vi.fn();
    const channelName = 'employee-updates';
    
    const channel = mockSupabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, mockCallback)
      .subscribe();

    expect(mockSupabase.getLastChannelName()).toBe(channelName);

    const mockPayload = {
      new: {
        id: '1',
        first_name: 'John Updated',
        last_name: 'Doe',
      },
      old: {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
      },
      type: 'UPDATE' as const,
    };

    mockSupabase.triggerSubscription('postgres_changes', mockPayload);

    expect(mockCallback).toHaveBeenCalledWith(mockPayload);

    channel.unsubscribe();
  });
}); 