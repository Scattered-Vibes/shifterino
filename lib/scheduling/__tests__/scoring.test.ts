import { describe, it, expect } from 'vitest'
import { calculateShiftScore } from '../scoring'
import type { Employee } from '@/types/supabase/index'
import type { ShiftEvent } from '@/types/scheduling/shift'
import type { GenerationContext, Holiday, ShiftPattern } from '@/types/scheduling/schedule'

describe('Shift Scoring System', () => {
  const baseEmployee: Employee = {
    id: 'emp1',
    auth_id: 'auth1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'dispatcher',
    preferred_shift_category: 'DAY',
    weekly_hours_cap: 40,
    max_overtime_hours: 10,
    shift_pattern: '4x10',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    created_by: 'system',
    updated_by: null,
    team_id: 'team1'
  }

  const baseShift: ShiftEvent = {
    id: 'shift1',
    employee_id: 'emp1',
    date: '2025-01-01',
    start: '2025-01-01T09:00:00.000Z',
    end: '2025-01-01T19:00:00.000Z',
    pattern: 'PATTERN_A',
    status: 'scheduled',
    notes: null
  }

  const baseContext: GenerationContext = {
    periodId: 'period1',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    employees: [baseEmployee],
    timeOffRequests: [],
    staffingRequirements: [{
      id: 'req1',
      start_time: '2025-01-01T09:00:00.000Z',
      end_time: '2025-01-01T21:00:00.000Z',
      min_total_staff: 6,
      min_supervisors: 1,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system',
      updated_by: null
    }],
    shiftOptions: [{
      id: 'opt1',
      name: 'Day Shift',
      start_time: '09:00',
      end_time: '19:00',
      duration_hours: 10,
      category: 'DAY',
      is_overnight: false,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system',
      updated_by: null
    }],
    params: {
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      employeeIds: ['emp1']
    },
    weeklyHours: {},
    shiftPatterns: {},
    existingShifts: [],
    holidays: []
  }

  describe('Hours Balance Scoring', () => {
    it('should give perfect score when hitting weekly cap exactly', () => {
      const context = {
        ...baseContext,
        weeklyHours: {
          emp1: {
            '2025-01-01T00:00:00.000Z': 30 // 30 existing hours
          }
        }
      }

      const shift = {
        ...baseShift,
        start: '2025-01-01T09:00:00.000Z',
        end: '2025-01-01T19:00:00.000Z' // 10 hours
      }

      const score = calculateShiftScore(baseEmployee, shift, context)
      expect(score).toBeGreaterThan(0.9) // Should be close to 1
    })

    it('should penalize for exceeding weekly cap', () => {
      const context = {
        ...baseContext,
        weeklyHours: {
          emp1: {
            '2025-01-01T00:00:00.000Z': 35 // 35 existing hours
          }
        }
      }

      const shift = {
        ...baseShift,
        start: '2025-01-01T09:00:00.000Z',
        end: '2025-01-01T19:00:00.000Z' // 10 hours
      }

      const score = calculateShiftScore(baseEmployee, shift, context)
      expect(score).toBeLessThan(0.8) // Should be penalized
    })
  })

  describe('Pattern Adherence Scoring', () => {
    it('should give perfect score when following established pattern', () => {
      const context = {
        ...baseContext,
        shiftPatterns: {
          emp1: {
            consecutiveShifts: 1,
            lastShiftEnd: new Date('2024-12-31T19:00:00.000Z'),
            currentPattern: 'PATTERN_A' as const
          }
        }
      }

      const score = calculateShiftScore(baseEmployee, baseShift, context)
      expect(score).toBeGreaterThan(0.9)
    })

    it('should penalize pattern switches', () => {
      const context = {
        ...baseContext,
        shiftPatterns: {
          emp1: {
            consecutiveShifts: 1,
            lastShiftEnd: new Date('2024-12-31T19:00:00.000Z'),
            currentPattern: 'PATTERN_B' as const
          }
        }
      }

      const score = calculateShiftScore(baseEmployee, baseShift, context)
      expect(score).toBeLessThan(0.8)
    })
  })

  describe('Preference Matching', () => {
    it('should give high score for preferred shift category', () => {
      const employee = {
        ...baseEmployee,
        preferred_shift_category: 'DAY' as const
      }

      const shift = {
        ...baseShift,
        start: '2025-01-01T09:00:00.000Z', // Day shift
        end: '2025-01-01T19:00:00.000Z'
      }

      const score = calculateShiftScore(employee, shift, baseContext)
      expect(score).toBeGreaterThan(0.9)
    })

    it('should penalize non-preferred shift categories', () => {
      const employee = {
        ...baseEmployee,
        preferred_shift_category: 'NIGHT' as const
      }

      const shift = {
        ...baseShift,
        start: '2025-01-01T09:00:00.000Z', // Day shift
        end: '2025-01-01T19:00:00.000Z'
      }

      const score = calculateShiftScore(employee, shift, baseContext)
      expect(score).toBeLessThan(0.8)
    })
  })

  describe('Skill Matching', () => {
    it('should penalize non-supervisors for supervisor shifts', () => {
      const context = {
        ...baseContext,
        staffingRequirements: [{
          id: 'req1',
          start_time: '2025-01-01T09:00:00.000Z',
          end_time: '2025-01-01T21:00:00.000Z',
          min_total_staff: 6,
          min_supervisors: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          created_by: 'system',
          updated_by: null
        }]
      }

      const employee = {
        ...baseEmployee,
        role: 'dispatcher' as const
      }

      const score = calculateShiftScore(employee, baseShift, context)
      expect(score).toBeLessThan(0.8)
    })

    it('should give high score to supervisors for supervisor shifts', () => {
      const context = {
        ...baseContext,
        staffingRequirements: [{
          id: 'req1',
          start_time: '2025-01-01T09:00:00.000Z',
          end_time: '2025-01-01T21:00:00.000Z',
          min_total_staff: 6,
          min_supervisors: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          created_by: 'system',
          updated_by: null
        }]
      }

      const employee = {
        ...baseEmployee,
        role: 'supervisor' as const
      }

      const score = calculateShiftScore(employee, baseShift, context)
      expect(score).toBeGreaterThan(0.9)
    })
  })

  describe('Fairness Scoring', () => {
    it('should penalize uneven distribution of undesirable shifts', () => {
      const context = {
        ...baseContext,
        existingShifts: [
          {
            ...baseShift,
            start: '2025-01-01T22:00:00.000Z',
            end: '2025-01-02T08:00:00.000Z'
          },
          {
            ...baseShift,
            start: '2025-01-02T22:00:00.000Z',
            end: '2025-01-03T08:00:00.000Z'
          }
        ]
      }

      const shift = {
        ...baseShift,
        start: '2025-01-03T22:00:00.000Z',
        end: '2025-01-04T08:00:00.000Z'
      }

      const score = calculateShiftScore(baseEmployee, shift, context)
      expect(score).toBeLessThan(0.8)
    })

    it('should penalize uneven distribution of holiday shifts', () => {
      const context = {
        ...baseContext,
        holidays: [{
          date: '2025-01-01',
          name: 'New Year\'s Day',
          isObserved: true
        }],
        existingShifts: [
          {
            ...baseShift,
            date: '2024-12-25',
            start: '2024-12-25T09:00:00.000Z',
            end: '2024-12-25T19:00:00.000Z'
          }
        ]
      }

      const shift = {
        ...baseShift,
        date: '2025-01-01',
        start: '2025-01-01T09:00:00.000Z',
        end: '2025-01-01T19:00:00.000Z'
      }

      const score = calculateShiftScore(baseEmployee, shift, context)
      expect(score).toBeLessThan(0.9)
    })
  })
}) 