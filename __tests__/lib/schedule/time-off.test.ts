import { describe, it, expect } from 'vitest'
import { validateTimeOffRequest, checkTimeOffConflicts } from '@/lib/schedule/time-off'
import { TimeOffRequest, ShiftAssignment, TimeOffType } from '@/types/schedule'

describe('Time Off Management', () => {
  const mockShiftAssignments: ShiftAssignment[] = [
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

  describe('validateTimeOffRequest', () => {
    it('should validate a valid time off request', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        type: 'vacation',
        status: 'pending',
        notes: 'Annual vacation'
      }

      const result = validateTimeOffRequest(request)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid date format', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '02-01-2025', // Invalid format
        endDate: '2025-02-07',
        type: 'vacation',
        status: 'pending',
        notes: 'Annual vacation'
      }

      const result = validateTimeOffRequest(request)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid date format: startDate must be YYYY-MM-DD')
    })

    it('should detect end date before start date', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-02-07',
        endDate: '2025-02-01', // Before start date
        type: 'vacation',
        status: 'pending',
        notes: 'Annual vacation'
      }

      const result = validateTimeOffRequest(request)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('End date must be after start date')
    })

    it('should detect invalid request type', () => {
      const request = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        type: 'invalid-type',
        status: 'pending',
        notes: 'Annual vacation'
      } as unknown as TimeOffRequest

      const result = validateTimeOffRequest(request)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid time off type')
    })

    it('should detect invalid status', () => {
      const request = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        type: 'vacation' as TimeOffType,
        status: 'invalid-status',
        notes: 'Annual vacation'
      } as unknown as TimeOffRequest

      const result = validateTimeOffRequest(request)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid status')
    })
  })

  describe('checkTimeOffConflicts', () => {
    it('should detect conflicts with existing shifts', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        type: 'vacation',
        status: 'pending',
        notes: 'Vacation'
      }

      const conflicts = checkTimeOffConflicts(request, mockShiftAssignments)
      expect(conflicts).toHaveLength(2)
      expect(conflicts[0].date).toBe('2025-01-01')
      expect(conflicts[1].date).toBe('2025-01-02')
    })

    it('should return no conflicts when shifts are outside time off period', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        type: 'vacation',
        status: 'pending',
        notes: 'Vacation'
      }

      const conflicts = checkTimeOffConflicts(request, mockShiftAssignments)
      expect(conflicts).toHaveLength(0)
    })

    it('should only detect conflicts for the requesting employee', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp2', // Different employee
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        type: 'vacation',
        status: 'pending',
        notes: 'Vacation'
      }

      const conflicts = checkTimeOffConflicts(request, mockShiftAssignments)
      expect(conflicts).toHaveLength(0)
    })

    it('should handle single day time off requests', () => {
      const request: TimeOffRequest = {
        id: '1',
        employeeId: 'emp1',
        startDate: '2025-01-01',
        endDate: '2025-01-01',
        type: 'sick',
        status: 'pending',
        notes: 'Sick day'
      }

      const conflicts = checkTimeOffConflicts(request, mockShiftAssignments)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].date).toBe('2025-01-01')
    })
  })
}) 