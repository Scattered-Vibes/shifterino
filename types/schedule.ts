export interface ShiftUpdateData {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  supervisor_id?: string;
}

export interface TimeOffRequest {
  start_date: string;
  end_date: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Shift {
  id: string;
  employee_id: string;
  supervisor_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  minStaff: number;
  currentStaff: number;
  supervisors: number;
  date: string;
}

export interface StaffingRequirement {
  id: string;
  timeBlockId: string;
  minStaff: number;
  supervisorsRequired: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  employeeId: string;
  timeBlockId: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
} 