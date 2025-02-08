import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmployeeSchedule } from '../../hooks/use-employee-schedule';
import { createMockSupabaseClient } from '../utils/mock-supabase';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../setup';

const mockSupabase = createMockSupabaseClient();

// Mock both client creation functions
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}));

describe('useEmployeeSchedule', () => {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    mockSupabase._mock.reset();
  });

  it('should fetch employee schedule successfully', async () => {
    const mockSchedule = [
      {
        id: '1',
        employee_id: 'emp1',
        shift_option_id: 'shift1',
        date: '2025-01-01'
      }
    ];

    mockSupabase._mock.mockSelectSuccess(mockSchedule);

    const { result } = renderHook(
      () => useEmployeeSchedule('emp1', '2025-01-01', '2025-01-07'),
      { wrapper }
    );

    // Wait for loading to complete and data to be available
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual(mockSchedule);
    expect(result.current.isError).toBe(false);
  });

  it('should handle error when fetching schedule', async () => {
    mockSupabase._mock.mockSelectError(new Error('Failed to fetch schedule'));

    const { result } = renderHook(
      () => useEmployeeSchedule('emp1', '2025-01-01', '2025-01-07'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('should update schedule in real-time', async () => {
    const initialSchedule = [
      {
        id: '1',
        employee_id: 'emp1',
        shift_option_id: 'shift1',
        date: '2025-01-01'
      }
    ];

    const updatedSchedule = [
      {
        id: '1',
        employee_id: 'emp1',
        shift_option_id: 'shift2',
        date: '2025-01-01'
      }
    ];

    mockSupabase._mock.mockSelectSuccess(initialSchedule);

    const { result } = renderHook(
      () => useEmployeeSchedule('emp1', '2025-01-01', '2025-01-07'),
      { wrapper }
    );

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual(initialSchedule);

    // Simulate real-time update
    const mockCalls = mockSupabase._mock.on.mock.calls;
    expect(mockCalls).toBeDefined();
    expect(mockCalls.length).toBeGreaterThan(0);

    const callback = mockCalls[0]?.[2];
    expect(callback).toBeDefined();

    if (callback && typeof callback === 'function') {
      // Update the mock data before triggering the callback
      mockSupabase._mock.updateCurrentResponse(updatedSchedule);
      
      callback({
        new: updatedSchedule[0],
        old: initialSchedule[0],
        eventType: 'UPDATE'
      });

      // Wait for the update to be reflected
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(updatedSchedule);
      }, { timeout: 2000 });
    }
  });
}); 