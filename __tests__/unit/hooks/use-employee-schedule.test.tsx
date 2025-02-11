import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEmployeeSchedule } from '@/lib/hooks';
import { createMockSupabaseClient } from '@/test/helpers/supabase-mock';
import { mockData } from '@/test/mocks/data';
import { Providers } from '@/test/utils/test-utils';

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => createMockSupabaseClient(),
  createBrowserClient: () => createMockSupabaseClient(),
}));

describe('useEmployeeSchedule', () => {
  const startDate = '2025-01-01';
  const endDate = '2025-01-07';

  it('fetches employee schedule', async () => {
    const mockSupabase = createMockSupabaseClient();
    
    const { result } = renderHook(
      () => useEmployeeSchedule(
        mockData.employees.default.id,
        startDate,
        endDate
      ),
      {
        wrapper: ({ children }) => (
          <Providers supabaseClient={mockSupabase}>{children}</Providers>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([mockData.schedules.default]);
    });
  });

  it('handles loading state', () => {
    const mockSupabase = createMockSupabaseClient();
    
    const { result } = renderHook(
      () => useEmployeeSchedule(
        mockData.employees.default.id,
        startDate,
        endDate
      ),
      {
        wrapper: ({ children }) => (
          <Providers supabaseClient={mockSupabase}>{children}</Providers>
        ),
      }
    );
    
    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    const mockSupabase = createMockSupabaseClient();
    const error = new Error('Failed to fetch schedule');
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(error),
      }),
    });

    const { result } = renderHook(
      () => useEmployeeSchedule(
        mockData.employees.default.id,
        startDate,
        endDate
      ),
      {
        wrapper: ({ children }) => (
          <Providers supabaseClient={mockSupabase}>{children}</Providers>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('updates schedule in real-time', async () => {
    const mockSupabase = createMockSupabaseClient();
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    };
    mockSupabase.channel = vi.fn().mockReturnValue(channel);

    const { result } = renderHook(
      () => useEmployeeSchedule(
        mockData.employees.default.id,
        startDate,
        endDate
      ),
      {
        wrapper: ({ children }) => (
          <Providers supabaseClient={mockSupabase}>{children}</Providers>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([mockData.schedules.default]);
    });

    const updatedSchedule = {
      ...mockData.schedules.default,
      shift_option_id: 'updated-shift',
    };

    // Simulate realtime update
    const [, handler] = channel.on.mock.calls[0];
    handler({
      new: updatedSchedule,
      old: mockData.schedules.default,
      eventType: 'UPDATE',
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([updatedSchedule]);
    });
  });
}); 