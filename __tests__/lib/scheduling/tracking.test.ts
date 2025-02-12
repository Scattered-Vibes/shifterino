import { describe, it, expect } from 'vitest'
import { 
  initializeTracking,
  updateWeeklyHours,
  updateShiftPattern,
  canAssignShift
} from '@/lib/scheduling/tracking'
import { mockData } from '@/test/mock-data'
import type { WeeklyHoursTracking, ShiftPatternTracking } from '@/types/models/shift'

describe('scheduling/tracking', () => {
  describe('initializeTracking', () => {
    it('should initialize tracking for all employees', () => {
      const employees = [mockData.employees.default, mockData.employees.supervisor]
      
      const { weeklyHours, shiftPatterns } = initializeTracking(employees)
      
      expect(Object.keys(weeklyHours)).toEqual(employees.map(e => e.id))
      expect(Object.keys(shiftPatterns)).toEqual(employees.map(e => e.id))
      
      // Check pattern initialization
      expect(shiftPatterns[employees[0].id]).toEqual({
        currentPattern: employees[0].shift_pattern,
        consecutiveDays: 0,
        lastShiftDate: null
      })
    })
  })

  describe('updateWeeklyHours', () => {
    it('should add hours to the correct week', () => {
      const tracking: WeeklyHoursTracking = {
        [mockData.employees.default.id]: {}
      }
      const date = '2025-01-01'
      const hours = 10

      const updated = updateWeeklyHours(
        tracking,
        mockData.employees.default.id,
        date,
        hours
      )

      const weekStart = '2024-12-29' // Sunday of that week
      expect(updated[mockData.employees.default.id][weekStart]).toBe(hours)
    })

    it('should accumulate hours within the same week', () => {
      const weekStart = '2024-12-29' // Sunday
      const tracking: WeeklyHoursTracking = {
        [mockData.employees.default.id]: {
          [weekStart]: 20 // Already worked 20 hours
        }
      }
      const date = '2025-01-01' // Wednesday of that week
      const hours = 10

      const updated = updateWeeklyHours(
        tracking,
        mockData.employees.default.id,
        date,
        hours
      )

      expect(updated[mockData.employees.default.id][weekStart]).toBe(30)
    })
  })

  describe('updateShiftPattern', () => {
    it('should increment consecutive days for consecutive shifts', () => {
      const tracking: ShiftPatternTracking = {
        [mockData.employees.default.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 1,
          lastShiftDate: '2025-01-01'
        }
      }
      const date = '2025-01-02' // Next day

      const updated = updateShiftPattern(
        tracking,
        mockData.employees.default.id,
        date
      )

      expect(updated[mockData.employees.default.id].consecutiveDays).toBe(2)
      expect(updated[mockData.employees.default.id].lastShiftDate).toBe(date)
    })

    it('should reset consecutive days for non-consecutive shifts', () => {
      const tracking: ShiftPatternTracking = {
        [mockData.employees.default.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 2,
          lastShiftDate: '2025-01-01'
        }
      }
      const date = '2025-01-03' // Gap day

      const updated = updateShiftPattern(
        tracking,
        mockData.employees.default.id,
        date
      )

      expect(updated[mockData.employees.default.id].consecutiveDays).toBe(1)
      expect(updated[mockData.employees.default.id].lastShiftDate).toBe(date)
    })
  })

  describe('canAssignShift', () => {
    it('should allow assignment within weekly hours cap', () => {
      const employee = mockData.employees.default
      const date = '2025-01-01'
      const shiftOption = mockData.shiftOptions.dayRegular
      const weeklyHours: WeeklyHoursTracking = {
        [employee.id]: {
          '2024-12-29': 20 // Only worked 20 hours this week
        }
      }
      const shiftPatterns: ShiftPatternTracking = {
        [employee.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 0,
          lastShiftDate: null
        }
      }

      const canAssign = canAssignShift(
        employee,
        date,
        shiftOption,
        weeklyHours,
        shiftPatterns
      )

      expect(canAssign).toBe(true)
    })

    it('should prevent assignment beyond weekly hours cap', () => {
      const employee = mockData.employees.default
      const date = '2025-01-01'
      const shiftOption = mockData.shiftOptions.dayRegular
      const weeklyHours: WeeklyHoursTracking = {
        [employee.id]: {
          '2024-12-29': 35 // Already worked 35 hours this week
        }
      }
      const shiftPatterns: ShiftPatternTracking = {
        [employee.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 0,
          lastShiftDate: null
        }
      }

      const canAssign = canAssignShift(
        employee,
        date,
        shiftOption,
        weeklyHours,
        shiftPatterns
      )

      expect(canAssign).toBe(false)
    })

    it('should allow overtime when employee has overtime hours available', () => {
      const employee = {
        ...mockData.employees.default,
        max_overtime_hours: 10
      }
      const date = '2025-01-01'
      const shiftOption = mockData.shiftOptions.dayRegular
      const weeklyHours: WeeklyHoursTracking = {
        [employee.id]: {
          '2024-12-29': 35 // Already worked 35 hours this week
        }
      }
      const shiftPatterns: ShiftPatternTracking = {
        [employee.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 0,
          lastShiftDate: null
        }
      }

      const canAssign = canAssignShift(
        employee,
        date,
        shiftOption,
        weeklyHours,
        shiftPatterns
      )

      expect(canAssign).toBe(true)
    })

    it('should enforce shift pattern constraints', () => {
      const employee = mockData.employees.default // PATTERN_A (4x10)
      const date = '2025-01-01'
      const shiftOption = {
        ...mockData.shiftOptions.dayRegular,
        duration_hours: 12 // Wrong duration for pattern
      }
      const weeklyHours: WeeklyHoursTracking = {
        [employee.id]: {}
      }
      const shiftPatterns: ShiftPatternTracking = {
        [employee.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 0,
          lastShiftDate: null
        }
      }

      const canAssign = canAssignShift(
        employee,
        date,
        shiftOption,
        weeklyHours,
        shiftPatterns
      )

      expect(canAssign).toBe(false)
    })

    it('should prevent more than maximum consecutive days', () => {
      const employee = mockData.employees.default
      const date = '2025-01-05'
      const shiftOption = mockData.shiftOptions.dayRegular
      const weeklyHours: WeeklyHoursTracking = {
        [employee.id]: {}
      }
      const shiftPatterns: ShiftPatternTracking = {
        [employee.id]: {
          currentPattern: 'PATTERN_A',
          consecutiveDays: 4, // Already worked 4 consecutive days
          lastShiftDate: '2025-01-04'
        }
      }

      const canAssign = canAssignShift(
        employee,
        date,
        shiftOption,
        weeklyHours,
        shiftPatterns
      )

      expect(canAssign).toBe(false)
    })
  })
}) 