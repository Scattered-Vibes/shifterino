import { describe, it, expect } from 'vitest'
import { validateShiftPattern, SHIFT_PATTERNS } from '../shift-patterns'
import type { ShiftEvent } from '@/types/scheduling/shift'

describe('validateShiftPattern', () => {
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

  describe('Pattern A (4x10)', () => {
    it('should validate four consecutive 10-hour shifts', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-01T09:00:00.000Z', end: '2025-01-01T19:00:00.000Z' },
        { ...baseShift, id: '2', start: '2025-01-02T09:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseShift, id: '3', start: '2025-01-03T09:00:00.000Z', end: '2025-01-03T19:00:00.000Z' },
        { ...baseShift, id: '4', start: '2025-01-04T09:00:00.000Z', end: '2025-01-04T19:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(true)
    })

    it('should reject non-consecutive shifts', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-01T09:00:00.000Z', end: '2025-01-01T19:00:00.000Z' },
        { ...baseShift, id: '2', start: '2025-01-02T09:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseShift, id: '3', start: '2025-01-04T09:00:00.000Z', end: '2025-01-04T19:00:00.000Z' }, // Gap
        { ...baseShift, id: '4', start: '2025-01-05T09:00:00.000Z', end: '2025-01-05T19:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(false)
    })

    it('should reject shifts of wrong duration', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-01T09:00:00.000Z', end: '2025-01-01T20:00:00.000Z' }, // 11 hours
        { ...baseShift, id: '2', start: '2025-01-02T09:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseShift, id: '3', start: '2025-01-03T09:00:00.000Z', end: '2025-01-03T19:00:00.000Z' },
        { ...baseShift, id: '4', start: '2025-01-04T09:00:00.000Z', end: '2025-01-04T19:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(false)
    })
  })

  describe('Pattern B (3x12+4)', () => {
    const baseBShift: ShiftEvent = {
      ...baseShift,
      pattern: 'PATTERN_B',
      start: '2025-01-01T07:00:00.000Z',
      end: '2025-01-01T19:00:00.000Z'
    }

    it('should validate three consecutive 12-hour shifts plus one 4-hour shift', () => {
      const shifts: ShiftEvent[] = [
        { ...baseBShift, id: '1', start: '2025-01-01T07:00:00.000Z', end: '2025-01-01T19:00:00.000Z' },
        { ...baseBShift, id: '2', start: '2025-01-02T07:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseBShift, id: '3', start: '2025-01-03T07:00:00.000Z', end: '2025-01-03T19:00:00.000Z' },
        { ...baseBShift, id: '4', start: '2025-01-04T07:00:00.000Z', end: '2025-01-04T11:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(true)
    })

    it('should reject if 4-hour shift is not last', () => {
      const shifts: ShiftEvent[] = [
        { ...baseBShift, id: '1', start: '2025-01-01T07:00:00.000Z', end: '2025-01-01T11:00:00.000Z' }, // 4 hours first
        { ...baseBShift, id: '2', start: '2025-01-02T07:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseBShift, id: '3', start: '2025-01-03T07:00:00.000Z', end: '2025-01-03T19:00:00.000Z' },
        { ...baseBShift, id: '4', start: '2025-01-04T07:00:00.000Z', end: '2025-01-04T19:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(false)
    })

    it('should reject if first three shifts are not consecutive', () => {
      const shifts: ShiftEvent[] = [
        { ...baseBShift, id: '1', start: '2025-01-01T07:00:00.000Z', end: '2025-01-01T19:00:00.000Z' },
        { ...baseBShift, id: '2', start: '2025-01-02T07:00:00.000Z', end: '2025-01-02T19:00:00.000Z' },
        { ...baseBShift, id: '3', start: '2025-01-04T07:00:00.000Z', end: '2025-01-04T19:00:00.000Z' }, // Gap
        { ...baseBShift, id: '4', start: '2025-01-05T07:00:00.000Z', end: '2025-01-05T11:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(false)
    })
  })

  describe('Weekly Hours Cap', () => {
    it('should reject if total hours exceed 40 without override', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-01T09:00:00.000Z', end: '2025-01-01T21:00:00.000Z' }, // 12 hours
        { ...baseShift, id: '2', start: '2025-01-02T09:00:00.000Z', end: '2025-01-02T21:00:00.000Z' }, // 12 hours
        { ...baseShift, id: '3', start: '2025-01-03T09:00:00.000Z', end: '2025-01-03T21:00:00.000Z' }, // 12 hours
        { ...baseShift, id: '4', start: '2025-01-04T09:00:00.000Z', end: '2025-01-04T15:00:00.000Z' }  // 6 hours
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(false)
    })

    it('should allow hours exceeding 40 with override', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', overrideHoursCap: true, start: '2025-01-01T09:00:00.000Z', end: '2025-01-01T21:00:00.000Z' },
        { ...baseShift, id: '2', overrideHoursCap: true, start: '2025-01-02T09:00:00.000Z', end: '2025-01-02T21:00:00.000Z' },
        { ...baseShift, id: '3', overrideHoursCap: true, start: '2025-01-03T09:00:00.000Z', end: '2025-01-03T21:00:00.000Z' },
        { ...baseShift, id: '4', overrideHoursCap: true, start: '2025-01-04T09:00:00.000Z', end: '2025-01-04T15:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle shifts crossing midnight', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-01T22:00:00.000Z', end: '2025-01-02T08:00:00.000Z' },
        { ...baseShift, id: '2', start: '2025-01-02T22:00:00.000Z', end: '2025-01-03T08:00:00.000Z' },
        { ...baseShift, id: '3', start: '2025-01-03T22:00:00.000Z', end: '2025-01-04T08:00:00.000Z' },
        { ...baseShift, id: '4', start: '2025-01-04T22:00:00.000Z', end: '2025-01-05T08:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(true)
    })

    it('should handle shifts crossing month boundaries', () => {
      const shifts: ShiftEvent[] = [
        { ...baseShift, id: '1', start: '2025-01-30T09:00:00.000Z', end: '2025-01-30T19:00:00.000Z' },
        { ...baseShift, id: '2', start: '2025-01-31T09:00:00.000Z', end: '2025-01-31T19:00:00.000Z' },
        { ...baseShift, id: '3', start: '2025-02-01T09:00:00.000Z', end: '2025-02-01T19:00:00.000Z' },
        { ...baseShift, id: '4', start: '2025-02-02T09:00:00.000Z', end: '2025-02-02T19:00:00.000Z' }
      ]

      expect(validateShiftPattern(shifts[0], shifts)).toBe(true)
    })
  })
}) 