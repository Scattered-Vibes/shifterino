import { describe, it, expect } from 'vitest'
import { validateSchedule, validateShiftAssignment } from '@/lib/schedule/validation'
import { StaffingRequirement, ShiftAssignment } from '@/types/schedule'

describe('Schedule Validation', () => {
  const mockStaffingRequirements: StaffingRequirement[] = [
    {
      id: '1',
      startTime: '05:00',
      endTime: '09:00',
      minEmployees: 6,
      requiresSupervisor: true
    },
    {
      id: '2',
      startTime: '09:00',
      endTime: '21:00',
      minEmployees: 8,
      requiresSupervisor: true
    },
    {
      id: '3',
      startTime: '21:00',
      endTime: '01:00',
      minEmployees: 7,
      requiresSupervisor: true
    },
    {
      id: '4',
      startTime: '01:00',
      endTime: '05:00',
      minEmployees: 6,
      requiresSupervisor: true
    }
  ]

  describe('validateSchedule', () => {
    it('should validate a schedule meeting all requirements', () => {
      const assignments: ShiftAssignment[] = [
        // Early shift (5 AM - 3 PM) - 4 employees including 1 supervisor
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
          employeeId: 'emp2',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        {
          id: '3',
          employeeId: 'emp3',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        {
          id: '4',
          employeeId: 'emp4',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        // Mid shift (9 AM - 7 PM) - 4 additional employees including 1 supervisor
        {
          id: '5',
          employeeId: 'emp5',
          shiftId: 'shift2',
          date: '2025-01-01',
          startTime: '09:00',
          endTime: '19:00',
          isSupervisor: true
        },
        {
          id: '6',
          employeeId: 'emp6',
          shiftId: 'shift2',
          date: '2025-01-01',
          startTime: '09:00',
          endTime: '19:00',
          isSupervisor: false
        },
        {
          id: '7',
          employeeId: 'emp7',
          shiftId: 'shift2',
          date: '2025-01-01',
          startTime: '09:00',
          endTime: '19:00',
          isSupervisor: false
        },
        {
          id: '8',
          employeeId: 'emp8',
          shiftId: 'shift2',
          date: '2025-01-01',
          startTime: '09:00',
          endTime: '19:00',
          isSupervisor: false
        }
      ]

      const result = validateSchedule(assignments, mockStaffingRequirements)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect insufficient staffing levels', () => {
      const assignments: ShiftAssignment[] = [
        // Only 3 employees when 6 are required
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
          employeeId: 'emp2',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        {
          id: '3',
          employeeId: 'emp3',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        }
      ]

      const result = validateSchedule(assignments, mockStaffingRequirements)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Insufficient staffing during 05:00-09:00: 3 employees scheduled, minimum 6 required')
    })

    it('should detect missing supervisor coverage', () => {
      const assignments: ShiftAssignment[] = [
        // No supervisor scheduled
        {
          id: '1',
          employeeId: 'emp1',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        {
          id: '2',
          employeeId: 'emp2',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        },
        {
          id: '3',
          employeeId: 'emp3',
          shiftId: 'shift1',
          date: '2025-01-01',
          startTime: '05:00',
          endTime: '15:00',
          isSupervisor: false
        }
      ]

      const result = validateSchedule(assignments, mockStaffingRequirements)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('No supervisor scheduled during 05:00-09:00')
    })
  })

  describe('validateShiftAssignment', () => {
    it('should validate a valid shift assignment', () => {
      const assignment: ShiftAssignment = {
        id: '1',
        employeeId: 'emp1',
        shiftId: 'shift1',
        date: '2025-01-01',
        startTime: '05:00',
        endTime: '15:00',
        isSupervisor: true
      }

      const result = validateShiftAssignment(assignment)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid time format', () => {
      const assignment: ShiftAssignment = {
        id: '1',
        employeeId: 'emp1',
        shiftId: 'shift1',
        date: '2025-01-01',
        startTime: '5:00', // Invalid format, should be '05:00'
        endTime: '15:00',
        isSupervisor: true
      }

      const result = validateShiftAssignment(assignment)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid time format: startTime must be in HH:mm format')
    })

    it('should detect invalid shift duration', () => {
      const assignment: ShiftAssignment = {
        id: '1',
        employeeId: 'emp1',
        shiftId: 'shift1',
        date: '2025-01-01',
        startTime: '05:00',
        endTime: '18:00', // 13 hours, exceeds maximum shift duration
        isSupervisor: true
      }

      const result = validateShiftAssignment(assignment)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid shift duration: must be either 4, 10, or 12 hours')
    })

    it('should detect invalid date format', () => {
      const assignment: ShiftAssignment = {
        id: '1',
        employeeId: 'emp1',
        shiftId: 'shift1',
        date: '01-01-2025', // Invalid format, should be YYYY-MM-DD
        startTime: '05:00',
        endTime: '15:00',
        isSupervisor: true
      }

      const result = validateShiftAssignment(assignment)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid date format: must be YYYY-MM-DD')
    })
  })
}) 