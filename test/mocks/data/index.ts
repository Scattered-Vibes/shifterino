export const mockData = {
  employees: {
    default: {
      id: '123',
      auth_id: 'auth_123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'dispatcher' as const,
      shift_pattern: 'pattern_a' as const,
      preferred_shift_category: 'day' as const,
    },
    supervisor: {
      id: '456',
      auth_id: 'auth_456',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      role: 'supervisor' as const,
      shift_pattern: 'pattern_b' as const,
      preferred_shift_category: 'swing' as const,
    }
  },
  schedules: {
    default: {
      id: 'shift_123',
      employee_id: '123',
      shift_option_id: 'option_123',
      date: '2025-01-01',
      status: 'scheduled' as const,
    }
  },
  staffing: {
    default: {
      min_total_staff: 6,
      min_supervisors: 1,
      time_block_start: '05:00',
      time_block_end: '09:00'
    },
    understaffed: {
      min_total_staff: 4,
      min_supervisors: 1,
      time_block_start: '05:00',
      time_block_end: '09:00'
    }
  }
} as const;

// Type utilities for mock data
export type MockEmployee = typeof mockData.employees.default;
export type MockSchedule = typeof mockData.schedules.default;
export type MockStaffing = typeof mockData.staffing.default; 