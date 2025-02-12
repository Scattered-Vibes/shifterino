export type ShiftCategory = 'early' | 'day' | 'swing' | 'graveyard'
export type ShiftPattern = 'pattern_a' | 'pattern_b' | 'custom'

export interface TimeBlock {
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  minTotalStaff: number
  minSupervisors: number
}

export interface ValidationError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface StaffingRequirement {
  id: string
  timeBlockStart: string // HH:mm format
  timeBlockEnd: string // HH:mm format
  minTotalStaff: number
  minSupervisors: number
  dayOfWeek?: number // 0-6, where 0 is Sunday
  isHoliday?: boolean
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  createdAt: string
  updatedAt: string
} 