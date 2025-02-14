import { describe, it, expect } from 'vitest'
import { validateShiftPattern, checkConsecutiveDays } from '@/lib/schedule/shift-pattern'
import { ShiftAssignment } from '@/types/schedule'

describe('Shift Pattern Validation', () => {
  describe('validateShiftPattern', () => {
    it('should validate a valid 4x10 pattern', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        }
      ]

      const result = validateShiftPattern(assignments, '4x10')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate a valid 3x12+4 pattern', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '17:00',
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '17:00',
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '17:00',
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '09:00',
          isSupervisor: true
        }
      ]

      const result = validateShiftPattern(assignments, '3x12+4')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect incorrect shift durations for 4x10 pattern', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '16:00', // 11 hours - incorrect
          isSupervisor: true
        }
      ]

      const result = validateShiftPattern(assignments, '4x10')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Shift on 2025-01-02 is not 10 hours long')
    })

    it('should detect incorrect number of shifts for 4x10 pattern', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        }
      ]

      const result = validateShiftPattern(assignments, '4x10')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Pattern requires 4 shifts, but found 2')
    })
  })

  describe('checkConsecutiveDays', () => {
    it('should validate consecutive days', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        }
      ]

      const result = checkConsecutiveDays(assignments)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect non-consecutive days', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-03', // Gap on Jan 2
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        }
      ]

      const result = checkConsecutiveDays(assignments)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Shifts must be on consecutive days')
    })

    it('should handle single shift', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: true
        }
      ]

      const result = checkConsecutiveDays(assignments)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
}) 