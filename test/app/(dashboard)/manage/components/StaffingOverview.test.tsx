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
    current_staff: 6,
    required_staff: 6,
    supervisor_count: 1
  };

  const mockUnderstaffedData = {
    current_staff: 4,
    required_staff: 6,
    supervisor_count: 1
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
    expect(mockSupabase._mock.select).toHaveBeenCalledWith('current_staff, required_staff, supervisor_count');
    expect(mockSupabase._mock.eq).toHaveBeenCalledWith('time_block', '05:00-09:00');

    // Wait for the data to be rendered
    await waitFor(() => {
      const currentStaff = screen.getByText(/Current Staff: 6/i);
      expect(currentStaff).toBeInTheDocument();
    });

    // Check other elements
    expect(screen.getByText(/Required Staff: 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Supervisors: 1/i)).toBeInTheDocument();
  });

  it('should show warning when understaffed', async () => {
    mockSupabase._mock.mockSelectSuccess(mockUnderstaffedData);
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    // Wait for the warning to appear
    await waitFor(() => {
      const warning = screen.getByText(/Understaffed/i);
      expect(warning).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show error state when data fetch fails', async () => {
    mockSupabase._mock.mockSelectError(new Error('Failed to fetch'));
    
    render(<StaffingOverview timeBlock="05:00-09:00" />);

    await waitFor(() => {
      const error = screen.getByText(/Error loading staffing data/i);
      expect(error).toBeInTheDocument();
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
      expect(screen.getByText(/Current Staff: 6/i)).toBeInTheDocument();
    });

    // Simulate real-time update
    const updatedData = {
      current_staff: 7,
      required_staff: 6,
      supervisor_count: 1
    };

    const mockPayload = {
      new: updatedData,
      old: mockData,
      eventType: 'UPDATE'
    };

    // Get the subscription callback and call it with the new data
    const onCallback = mockSupabase._mock.on.mock.calls[0][2];
    onCallback(mockPayload);

    // Wait for the update to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Current Staff: 7/i)).toBeInTheDocument();
    });
  });
}); 