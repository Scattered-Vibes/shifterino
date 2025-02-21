import { describe, it, expect } from 'vitest'
import { calculateShiftScore } from '../scoring'
import { parseISO } from 'date-fns'
import type { Employee } from '@/types/scheduling/schedule'
import type { ShiftEvent } from '@/types/scheduling/shift'
import type { GenerationContext } from '@/types/scheduling/schedule'
import type { ShiftPattern } from '@/types/shift-patterns'

describe('Shift Scoring', () => {
  const baseShift: ShiftEvent = {
    id: 'shift1',
    employeeId: '1',
    employeeRole: 'dispatcher',
    title: 'Test Shift',
    start: '2025-01-01T08:00:00Z',
    end: '2025-01-01T18:00:00Z',
    pattern: 'PATTERN_A' as ShiftPattern,
    status: 'scheduled',
    shiftOptionId: 'opt1'
  }

  const baseEmployee: Employee = {
    id: '1',
    name: 'Test Employee',
    email: 'test@example.com',
    role: 'dispatcher',
    shift_pattern: 'PATTERN_A' as ShiftPattern,
    max_weekly_hours: 40
  }

  const baseContext: GenerationContext = {
    periodId: 'period1',
    startDate: '2025-01-01',
    endDate: '2025-01-07',
    employees: [baseEmployee],
    timeOffRequests: [],
    staffingRequirements: [],
    shiftOptions: [],
    params: {
      startDate: '2025-01-01',
      endDate: '2025-01-07',
      employeeIds: ['1']
    },
    weeklyHours: {},
    shiftPatterns: {
      '1': {
        consecutiveShifts: 0,
        lastShiftEnd: null,
        currentPattern: 'PATTERN_A' as ShiftPattern
      }
    },
    existingShifts: [],
    holidays: []
  }

  it('gives perfect score for ideal shift pattern', () => {
    const score = calculateShiftScore(baseEmployee, baseShift, baseContext)
    expect(score).toBeGreaterThan(0.8) // High score for ideal conditions
  })

  it('penalizes shifts that exceed weekly hours cap', () => {
    const employee = {
      ...baseEmployee,
      max_weekly_hours: 35 // Adding 10 hours would exceed 40
    }

    const score = calculateShiftScore(employee, baseShift, baseContext)
    expect(score).toBeLessThan(0.8)
  })

  it('penalizes non-consecutive shifts', () => {
    const context = {
      ...baseContext,
      shiftPatterns: {
        '1': {
          consecutiveShifts: 1,
          lastShiftEnd: '2024-12-29T18:00:00Z', // More than 24 hours gap
          currentPattern: 'PATTERN_A' as ShiftPattern
        }
      }
    }

    const score = calculateShiftScore(baseEmployee, baseShift, context)
    expect(score).toBeLessThan(0.8)
  })

  it('handles shifts crossing midnight', () => {
    const nightShift: ShiftEvent = {
      ...baseShift,
      start: '2025-01-01T22:00:00Z',
      end: '2025-01-02T08:00:00Z'
    }

    const score = calculateShiftScore(baseEmployee, nightShift, baseContext)
    expect(score).toBeGreaterThan(0)
  })

  it('considers shift pattern preferences', () => {
    const twelveHourShift: ShiftEvent = {
      ...baseShift,
      start: '2025-01-01T08:00:00Z',
      end: '2025-01-01T20:00:00Z',
      pattern: 'PATTERN_B' as ShiftPattern
    }

    const employee = {
      ...baseEmployee,
      shift_pattern: 'PATTERN_B' as ShiftPattern
    }

    const score = calculateShiftScore(employee, twelveHourShift, baseContext)
    expect(score).toBeGreaterThan(0)
  })

  it('penalizes insufficient rest periods', () => {
    const context = {
      ...baseContext,
      shiftPatterns: {
        '1': {
          consecutiveShifts: 1,
          lastShiftEnd: '2024-12-31T16:00:00Z', // Less than 8 hours rest
          currentPattern: 'PATTERN_A' as ShiftPattern
        }
      }
    }

    const score = calculateShiftScore(baseEmployee, baseShift, context)
    expect(score).toBeLessThan(0.8)
  })

  it('considers supervisor requirements', () => {
    const context = {
      ...baseContext,
      staffingRequirements: [{
        id: 'req1',
        timeBlockStart: '2025-01-01T08:00:00Z',
        timeBlockEnd: '2025-01-01T20:00:00Z',
        minTotalStaff: 6,
        minSupervisors: 1
      }]
    }

    const supervisorEmployee = {
      ...baseEmployee,
      role: 'supervisor' as const
    }

    const supervisorScore = calculateShiftScore(supervisorEmployee, baseShift, context)
    const dispatcherScore = calculateShiftScore(baseEmployee, baseShift, context)
    expect(supervisorScore).toBeGreaterThan(dispatcherScore)
  })
}) 