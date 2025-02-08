import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '../../utils/mock-supabase';
import { getEmployeeSchedule, updateShift, createTimeOffRequest } from '@/lib/supabase/service';

// Mock the createClient function
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Create a single instance of mockSupabase to be used across tests
const mockSupabase = createMockSupabaseClient();

describe('Supabase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase._mock.reset();
  });

  describe('getEmployeeSchedule', () => {
    it('should fetch employee schedule', async () => {
      const employeeId = '123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      await getEmployeeSchedule(employeeId, startDate, endDate);

      expect(mockSupabase.from).toHaveBeenCalledWith('individual_shifts');
      expect(mockSupabase._mock.select).toHaveBeenCalled();
      expect(mockSupabase._mock.eq).toHaveBeenCalledWith('employee_id', employeeId);
      expect(mockSupabase._mock.gte).toHaveBeenCalledWith('date', startDate);
      expect(mockSupabase._mock.lte).toHaveBeenCalledWith('date', endDate);
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

      expect(mockSupabase.from).toHaveBeenCalledWith('individual_shifts');
      expect(mockSupabase._mock.update).toHaveBeenCalledWith(updateData);
      expect(mockSupabase._mock.eq).toHaveBeenCalledWith('id', shiftId);
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

      expect(mockSupabase.from).toHaveBeenCalledWith('time_off_requests');
      expect(mockSupabase._mock.insert).toHaveBeenCalledWith([request]);
    });
  });
}); 