import { describe, it, expect } from 'vitest'
import { validateWeeklyHours, calculateWeeklyHours } from '@/lib/schedule/weekly-hours'
import { ShiftAssignment } from '@/types/schedule'

describe('Weekly Hours Validation', () => {
  describe('calculateWeeklyHours', () => {
    it('should calculate total hours for a week', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01', // Wednesday
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02', // Thursday
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03', // Friday
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04', // Saturday
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        }
      ]

      const weeklyHours = calculateWeeklyHours(assignments)
      expect(weeklyHours).toBe(40)
    })

    it('should handle shifts crossing midnight', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '20:00',
          endTime: '06:00', // 10 hours, crossing midnight
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '20:00',
          endTime: '06:00', // 10 hours, crossing midnight
          isSupervisor: true
        }
      ]

      const weeklyHours = calculateWeeklyHours(assignments)
      expect(weeklyHours).toBe(20)
    })

    it('should handle multiple shifts in one day', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '09:00', // 4 hours
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-01',
          startTime: '13:00',
          endTime: '17:00', // 4 hours
          isSupervisor: true
        }
      ]

      const weeklyHours = calculateWeeklyHours(assignments)
      expect(weeklyHours).toBe(8)
    })
  })

  describe('validateWeeklyHours', () => {
    it('should validate schedule within 40 hours', () => {
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
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '15:00', // 10 hours
          isSupervisor: true
        }
      ]

      const result = validateWeeklyHours(assignments)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect when weekly hours exceed 40', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '09:00', // 4 hours
          isSupervisor: true
        }
      ]

      const result = validateWeeklyHours(assignments)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Weekly hours (40) exceed maximum allowed (40)')
    })

    it('should validate schedule with approved overtime', () => {
      const assignments: ShiftAssignment[] = [
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '2',
          employeeId: 'emp1',
          shiftId: 'shift2',
          date: '2025-01-02',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '3',
          employeeId: 'emp1',
          shiftId: 'shift3',
          date: '2025-01-03',
          startTime: '05:00',
          endTime: '17:00', // 12 hours
          isSupervisor: true
        },
        {
          id: '4',
          employeeId: 'emp1',
          shiftId: 'shift4',
          date: '2025-01-04',
          startTime: '05:00',
          endTime: '09:00', // 4 hours
          isSupervisor: true
        }
      ]

      const result = validateWeeklyHours(assignments, true) // overtime approved
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
}) 