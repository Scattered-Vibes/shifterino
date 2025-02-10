import type { Employee, ShiftOption, TimeOffRequest, StaffingRequirement, IndividualShift } from '@/types/database'

export const mockEmployees: Record<string, Employee> = {
  default: {
    id: 'emp-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'DISPATCHER',
    shift_pattern: 'PATTERN_A',
    preferred_shift_category: 'DAY',
    weekly_hours_cap: 40,
    max_overtime_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  supervisor: {
    id: 'emp-2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    role: 'SUPERVISOR',
    shift_pattern: 'PATTERN_B',
    preferred_shift_category: 'SWING',
    weekly_hours_cap: 40,
    max_overtime_hours: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export const mockShiftOptions: Record<string, ShiftOption> = {
  dayEarly: {
    id: 'shift-1',
    category: 'EARLY',
    start_time: '05:00',
    end_time: '15:00',
    duration_hours: 10,
    updated_at: new Date().toISOString()
  },
  dayRegular: {
    id: 'shift-2',
    category: 'DAY',
    start_time: '09:00',
    end_time: '19:00',
    duration_hours: 10,
    updated_at: new Date().toISOString()
  },
  swing: {
    id: 'shift-3',
    category: 'SWING',
    start_time: '15:00',
    end_time: '01:00',
    duration_hours: 10,
    updated_at: new Date().toISOString()
  },
  graveyard: {
    id: 'shift-4',
    category: 'GRAVEYARD',
    start_time: '21:00',
    end_time: '07:00',
    duration_hours: 10,
    updated_at: new Date().toISOString()
  }
}

export const mockTimeOffRequests: Record<string, TimeOffRequest> = {
  approved: {
    id: 'time-off-1',
    employee_id: mockEmployees.default.id,
    start_date: '2025-01-10',
    end_date: '2025-01-20',
    status: 'APPROVED',
    notes: 'Vacation',
    updated_at: new Date().toISOString()
  },
  pending: {
    id: 'time-off-2',
    employee_id: mockEmployees.supervisor.id,
    start_date: '2025-02-01',
    end_date: '2025-02-05',
    status: 'PENDING',
    notes: 'Personal',
    updated_at: new Date().toISOString()
  }
}

export const mockStaffingRequirements: Record<string, StaffingRequirement> = {
  dayEarly: {
    id: 'req-1',
    start_time: '05:00',
    end_time: '09:00',
    min_total_staff: 6,
    min_supervisors: 1,
    is_holiday: false,
    updated_at: new Date().toISOString()
  },
  dayPeak: {
    id: 'req-2',
    start_time: '09:00',
    end_time: '21:00',
    min_total_staff: 8,
    min_supervisors: 1,
    is_holiday: false,
    updated_at: new Date().toISOString()
  },
  evening: {
    id: 'req-3',
    start_time: '21:00',
    end_time: '01:00',
    min_total_staff: 7,
    min_supervisors: 1,
    is_holiday: false,
    updated_at: new Date().toISOString()
  },
  overnight: {
    id: 'req-4',
    start_time: '01:00',
    end_time: '05:00',
    min_total_staff: 6,
    min_supervisors: 1,
    is_holiday: false,
    updated_at: new Date().toISOString()
  }
}

export const mockIndividualShifts: Record<string, IndividualShift> = {
  default: {
    id: 'shift-instance-1',
    employee_id: mockEmployees.default.id,
    shift_option_id: mockShiftOptions.dayRegular.id,
    schedule_period_id: 'period-1',
    date: '2025-01-01',
    actual_start_time: '2025-01-01T09:00:00Z',
    actual_end_time: '2025-01-01T19:00:00Z',
    status: 'SCHEDULED',
    updated_at: new Date().toISOString()
  },
  supervisor: {
    id: 'shift-instance-2',
    employee_id: mockEmployees.supervisor.id,
    shift_option_id: mockShiftOptions.swing.id,
    schedule_period_id: 'period-1',
    date: '2025-01-01',
    actual_start_time: '2025-01-01T15:00:00Z',
    actual_end_time: '2025-01-02T01:00:00Z',
    status: 'SCHEDULED',
    updated_at: new Date().toISOString()
  }
}

export const mockData = {
  employees: mockEmployees,
  shiftOptions: mockShiftOptions,
  timeOffRequests: mockTimeOffRequests,
  staffingRequirements: mockStaffingRequirements,
  individualShifts: mockIndividualShifts
} 