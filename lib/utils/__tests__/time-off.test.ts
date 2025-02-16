import { describe, it, expect } from 'vitest'
import {
  checkTimeOffConflicts,
  checkShiftConflicts,
  checkTimeOffRequestConflicts
} from '../time-off'
import type { ShiftEvent } from '@/types/scheduling/shift'
import type { TimeOffRequest } from '@/types/supabase/index'

describe('Time Off Conflict Checking', () => {
  const baseShift: ShiftEvent = {
    id: '1',
    employee_id: 'emp1',
    date: '2025-01-01',
    start: '2025-01-01T09:00:00.000Z',
    end: '2025-01-01T19:00:00.000Z',
    pattern: 'PATTERN_A',
    status: 'scheduled',
    notes: null
  }

  const baseTimeOff: TimeOffRequest = {
    id: '1',
    employee_id: 'emp1',
    start_date: '2025-01-01',
    end_date: '2025-01-03',
    status: 'approved',
    created_at: '2024-12-01T00:00:00.000Z',
    updated_at: '2024-12-01T00:00:00.000Z',
    created_by: 'emp1',
    updated_by: null,
    notes: null
  }

  describe('checkTimeOffConflicts', () => {
    it('should detect full overlap with time off', () => {
      const shift: ShiftEvent = {
        ...baseShift,
        start: '2025-01-02T09:00:00.000Z',
        end: '2025-01-02T19:00:00.000Z'
      }

      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const conflicts = checkTimeOffConflicts(shift, [timeOff])
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('FULL_OVERLAP')
    })

    it('should detect partial overlap at start of time off', () => {
      const shift: ShiftEvent = {
        ...baseShift,
        start: '2024-12-31T20:00:00.000Z',
        end: '2025-01-01T06:00:00.000Z'
      }

      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const conflicts = checkTimeOffConflicts(shift, [timeOff])
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('PARTIAL_OVERLAP')
    })

    it('should detect partial overlap at end of time off', () => {
      const shift: ShiftEvent = {
        ...baseShift,
        start: '2025-01-03T20:00:00.000Z',
        end: '2025-01-04T06:00:00.000Z'
      }

      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const conflicts = checkTimeOffConflicts(shift, [timeOff])
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('PARTIAL_OVERLAP')
    })

    it('should not detect conflict for different employee', () => {
      const shift: ShiftEvent = {
        ...baseShift,
        employee_id: 'emp2',
        start: '2025-01-02T09:00:00.000Z',
        end: '2025-01-02T19:00:00.000Z'
      }

      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        employee_id: 'emp1',
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const conflicts = checkTimeOffConflicts(shift, [timeOff])
      expect(conflicts).toHaveLength(0)
    })

    it('should not detect conflict for non-approved time off', () => {
      const shift: ShiftEvent = {
        ...baseShift,
        start: '2025-01-02T09:00:00.000Z',
        end: '2025-01-02T19:00:00.000Z'
      }

      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        status: 'pending',
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const conflicts = checkTimeOffConflicts(shift, [timeOff])
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('checkShiftConflicts', () => {
    it('should detect conflicts with existing shifts', () => {
      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-03'
      }

      const shifts: ShiftEvent[] = [
        {
          ...baseShift,
          start: '2025-01-02T09:00:00.000Z',
          end: '2025-01-02T19:00:00.000Z'
        }
      ]

      const conflicts = checkShiftConflicts(timeOff, shifts)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('FULL_OVERLAP')
    })

    it('should not detect conflicts for different employee', () => {
      const timeOff: TimeOffRequest = {
        ...baseTimeOff,
        employee_id: 'emp1'
      }

      const shifts: ShiftEvent[] = [
        {
          ...baseShift,
          employee_id: 'emp2',
          start: '2025-01-02T09:00:00.000Z',
          end: '2025-01-02T19:00:00.000Z'
        }
      ]

      const conflicts = checkShiftConflicts(timeOff, shifts)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('checkTimeOffRequestConflicts', () => {
    it('should detect overlapping time off requests', () => {
      const request: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-07'
      }

      const existingRequests: TimeOffRequest[] = [
        {
          ...baseTimeOff,
          id: '2',
          start_date: '2025-01-05',
          end_date: '2025-01-10'
        }
      ]

      expect(checkTimeOffRequestConflicts(request, existingRequests)).toBe(true)
    })

    it('should not detect conflict for different employee', () => {
      const request: TimeOffRequest = {
        ...baseTimeOff,
        employee_id: 'emp1',
        start_date: '2025-01-01',
        end_date: '2025-01-07'
      }

      const existingRequests: TimeOffRequest[] = [
        {
          ...baseTimeOff,
          id: '2',
          employee_id: 'emp2',
          start_date: '2025-01-05',
          end_date: '2025-01-10'
        }
      ]

      expect(checkTimeOffRequestConflicts(request, existingRequests)).toBe(false)
    })

    it('should not detect conflict with non-approved requests', () => {
      const request: TimeOffRequest = {
        ...baseTimeOff,
        start_date: '2025-01-01',
        end_date: '2025-01-07'
      }

      const existingRequests: TimeOffRequest[] = [
        {
          ...baseTimeOff,
          id: '2',
          status: 'pending',
          start_date: '2025-01-05',
          end_date: '2025-01-10'
        }
      ]

      expect(checkTimeOffRequestConflicts(request, existingRequests)).toBe(false)
    })

    it('should not compare request with itself', () => {
      const request: TimeOffRequest = {
        ...baseTimeOff,
        id: '1',
        start_date: '2025-01-01',
        end_date: '2025-01-07'
      }

      const existingRequests: TimeOffRequest[] = [request]

      expect(checkTimeOffRequestConflicts(request, existingRequests)).toBe(false)
    })
  })
}) 