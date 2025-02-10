// test/app/(dashboard)/manage/actions/schedule.test.ts

import { 
    checkTimeOffConflicts, 
    updateSchedule, 
    createScheduleEntry, 
    deleteSchedule 
  } from '@/app/(dashboard)/manage/actions/schedule';
  
  import { createMockSupabaseClient } from '@/test/helpers/supabase-mock';
  import { vi, describe, it, expect, beforeEach } from 'vitest';
  
  vi.mock('@/lib/auth', () => ({
    requireAuth: vi.fn().mockResolvedValue({ role: 'manager', employeeId: 'manager-id' }),
  }));
  
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }));
  
  describe('Schedule Actions', () => {
    let mockSupabase = createMockSupabaseClient();
  
    beforeEach(() => {
      vi.clearAllMocks();
      mockSupabase = createMockSupabaseClient();
    });
  
    describe('checkTimeOffConflicts', () => {
      it('should detect conflicts with existing time off requests', async () => {
        const existingRequests = [
          {
            id: 'request-1',
            employee_id: 'emp-1',
            start_date: '2024-03-15',
            end_date: '2024-03-17',
            status: 'approved'
          }
        ];
  
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValueOnce({
            data: existingRequests,
            error: null
          })
        }));
  
        const result = await checkTimeOffConflicts({
          employee_id: 'emp-1',
          start_date: '2024-03-16',
          end_date: '2024-03-18'
        });
  
        expect(result.hasConflict).toBe(true);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].id).toBe('request-1');
      });
  
      it('should return no conflicts when dates don\'t overlap', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValueOnce({
            data: [],
            error: null
          })
        }));
  
        const result = await checkTimeOffConflicts({
          employee_id: 'emp-1',
          start_date: '2024-03-20',
          end_date: '2024-03-22'
        });
  
        expect(result.hasConflict).toBe(false);
        expect(result.conflicts).toHaveLength(0);
      });
  
      it('should handle invalid date formats', async () => {
        const result = await checkTimeOffConflicts({
          employee_id: 'emp-1',
          start_date: 'invalid-date',
          end_date: '2024-03-22'
        });
  
        expect(result.error).toBe('Invalid date format');
      });
    });
  
    describe('createScheduleEntry', () => {
      it('should create a new schedule entry', async () => {
        const scheduleData = {
          employee_id: 'emp-1',
          start_time: '2024-03-15T09:00:00',
          end_time: '2024-03-15T17:00:00',
          shift_type: 'regular'
        };
  
        mockSupabase.from.mockImplementationOnce(() => ({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValueOnce({
            data: [{ id: 'schedule-1', ...scheduleData }],
            error: null
          })
        }));
  
        const result = await createScheduleEntry(scheduleData);
  
        expect(result.error).toBeUndefined();
        expect(result.data).toMatchObject({
          id: 'schedule-1',
          ...scheduleData
        });
        expect(mockSupabase.from).toHaveBeenCalledWith('schedules');
      });
  
      it('should validate shift duration rules', async () => {
        const result = await createScheduleEntry({
          employee_id: 'emp-1',
          start_time: '2024-03-15T09:00:00',
          end_time: '2024-03-16T09:00:00', // 24-hour shift
          shift_type: 'regular'
        });
  
        expect(result.error).toBe('Shift duration cannot exceed 12 hours');
      });
  
      it('should check for overlapping shifts', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          overlaps: vi.fn().mockResolvedValueOnce({
            data: [{ id: 'existing-shift' }],
            error: null
          })
        }));
  
        const result = await createScheduleEntry({
          employee_id: 'emp-1',
          start_time: '2024-03-15T09:00:00',
          end_time: '2024-03-15T17:00:00',
          shift_type: 'regular'
        });
  
        expect(result.error).toBe('Employee has overlapping shifts');
      });
    });
  
    describe('updateSchedule', () => {
      it('should update an existing schedule entry', async () => {
        const updateData = {
          id: 'schedule-1',
          start_time: '2024-03-15T10:00:00',
          end_time: '2024-03-15T18:00:00'
        };
  
        mockSupabase.from.mockImplementationOnce(() => ({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValueOnce({
            data: [{ id: 'schedule-1', ...updateData }],
            error: null
          })
        }));
  
        const result = await updateSchedule(updateData);
  
        expect(result.error).toBeUndefined();
        expect(result.data).toMatchObject(updateData);
      });
  
      it('should validate minimum staffing requirements', async () => {
        // Mock getting current staffing levels
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          overlaps: vi.fn().mockResolvedValueOnce({
            data: [{ count: 5 }], // Below minimum requirement of 6
            error: null
          })
        }));
  
        const result = await updateSchedule({
          id: 'schedule-1',
          start_time: '2024-03-15T05:00:00', // 5 AM shift
          end_time: '2024-03-15T09:00:00'
        });
  
        expect(result.error).toBe('Update would violate minimum staffing requirements');
      });
  
      it('should prevent updates to past shifts', async () => {
        const result = await updateSchedule({
          id: 'schedule-1',
          start_time: '2023-03-15T09:00:00', // Past date
          end_time: '2023-03-15T17:00:00'
        });
  
        expect(result.error).toBe('Cannot modify shifts in the past');
      });
    });
  
    describe('deleteSchedule', () => {
      it('should delete a schedule entry', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: { id: 'schedule-1' },
            error: null
          })
        }));
  
        const result = await deleteSchedule('schedule-1');
  
        expect(result.error).toBeUndefined();
        expect(mockSupabase.from).toHaveBeenCalledWith('schedules');
      });
  
      it('should prevent deletion of past shifts', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: [{
              start_time: '2023-03-15T09:00:00' // Past date
            }],
            error: null
          })
        }));
  
        const result = await deleteSchedule('schedule-1');
  
        expect(result.error).toBe('Cannot delete shifts in the past');
      });
  
      it('should validate minimum staffing requirements before deletion', async () => {
        // Mock getting current staffing levels
        mockSupabase.from.mockImplementationOnce(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({
            data: [{ count: 6 }], // At minimum requirement
            error: null
          })
        }));
  
        const result = await deleteSchedule('schedule-1');
  
        expect(result.error).toBe('Deletion would violate minimum staffing requirements');
      });
    });
  });