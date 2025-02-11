export interface Schedule {
  id: string
  employeeId: string
  date: string | Date
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  shiftType: string
  startTime: string
  endTime: string
  notes?: string
  createdAt: string
  updatedAt: string
} 