import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StaffingOverview } from '@/app/(dashboard)/manage/components/StaffingOverview';
import { createMockSupabaseClient } from '@/test/utils/mock-supabase';

let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

// Mock the getSupabaseClient function
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase
}));

describe('StaffingOverview', () => {
  const mockData = {
    min_total_staff: 6,
    min_supervisors: 1,
    time_block_start: '05:00',
    time_block_end: '09:00'
  };

  const mockUnderstaffedData = {
    min_total_staff: 4,
    min_supervisors: 1,
    time_block_start: '05:00',
    time_block_end: '09:00'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockSupabase._mock.reset();
  });

  it('should render current staffing levels', async () => {
    mockSupabase._mock.mockSelectSuccess(mockData);
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    // Wait for the initial data fetch
    expect(mockSupabase.from).toHaveBeenCalledWith('staffing_requirements');
    expect(mockSupabase._mock.select).toHaveBeenCalledWith('min_total_staff, min_supervisors, time_block_start, time_block_end');
    expect(mockSupabase._mock.eq).toHaveBeenCalledWith('time_block', '05:00-09:00');

    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Required Staff: 6/i)).toBeInTheDocument();
    });

    // Check other elements
    expect(screen.getByText(/Required Supervisors: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/05:00 to 09:00/i)).toBeInTheDocument();
  });

  it('should show warning when understaffed', async () => {
    mockSupabase._mock.mockSelectSuccess(mockUnderstaffedData);
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    // Wait for the warning to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Understaffed/i)).toBeInTheDocument();
  });

  it('should show error state when data fetch fails', async () => {
    mockSupabase._mock.mockSelectError(new Error('Failed to fetch'));
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading staffing data/i)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Create a promise that never resolves to keep the loading state
    mockSupabase._mock.single.mockImplementation(() => new Promise(() => {}));
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should update in real-time when staffing changes', async () => {
    mockSupabase._mock.mockSelectSuccess(mockData);
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText(/Required Staff: 6/i)).toBeInTheDocument();
    });

    // Simulate real-time update
    const updatedData = {
      min_total_staff: 7,
      min_supervisors: 1,
      time_block_start: '05:00',
      time_block_end: '09:00'
    };

    const mockCalls = mockSupabase._mock.on.mock.calls;
    expect(mockCalls).toBeDefined();
    expect(mockCalls.length).toBeGreaterThan(0);

    const firstCall = mockCalls[0];
    if (firstCall) {
      const onCallback = firstCall[2];
      if (typeof onCallback === 'function') {
        const mockPayload = {
          new: updatedData,
          old: mockData,
          eventType: 'UPDATE'
        };

        // Update the mock data before triggering the callback
        mockSupabase._mock.updateCurrentResponse(updatedData);
        onCallback(mockPayload);

        // Wait for the update to be rendered
        await waitFor(() => {
          expect(screen.getByText(/Required Staff: 7/i)).toBeInTheDocument();
        });
      }
    }
  });
}); 