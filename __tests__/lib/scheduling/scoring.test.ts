import { describe, it, expect } from 'vitest'
import { calculateShiftScore, DEFAULT_WEIGHTS } from '@/lib/scheduling/scoring'
import { mockData } from '@/test/mock-data'

describe('scheduling/scoring', () => {
  describe('calculateShiftScore', () => {
    it('should give high score for preferred shift category', () => {
      const employee = mockData.employees.default // Prefers DAY shifts
      const shiftOption = mockData.shiftOptions.dayRegular // DAY shift
      const date = '2025-01-01'
      const existingShifts = []

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.factors.preferredCategoryScore).toBe(1)
    })

    it('should give lower score for non-preferred category', () => {
      const employee = mockData.employees.default // Prefers DAY shifts
      const shiftOption = mockData.shiftOptions.graveyard // GRAVEYARD shift
      const date = '2025-01-01'
      const existingShifts = []

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.factors.preferredCategoryScore).toBe(0)
    })

    it('should consider time since last shift', () => {
      const employee = mockData.employees.default
      const shiftOption = mockData.shiftOptions.dayRegular
      const date = '2025-01-02'
      const existingShifts = [mockData.individualShifts.default] // Previous shift on 2025-01-01

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.factors.timeSinceLastShiftScore).toBeGreaterThan(0)
    })

    it('should give low score when shift is too close to last shift', () => {
      const employee = mockData.employees.default
      const shiftOption = mockData.shiftOptions.dayRegular
      const date = '2025-01-01'
      const existingShifts = [{
        ...mockData.individualShifts.default,
        actual_end_time: '2025-01-01T07:00:00Z' // Ended just 2 hours ago
      }]

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.factors.timeSinceLastShiftScore).toBe(0)
    })

    it('should consider weekly hours balance', () => {
      const employee = mockData.employees.default
      const shiftOption = mockData.shiftOptions.dayRegular
      const date = '2025-01-01'
      const existingShifts = [] // No shifts this week

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.factors.weeklyHoursBalanceScore).toBeGreaterThan(0)
    })

    it('should give low score when close to weekly hours cap', () => {
      const employee = mockData.employees.default
      const shiftOption = mockData.shiftOptions.dayRegular
      const date = '2025-01-05'
      const existingShifts = [
        // Already worked 35 hours this week
        mockData.individualShifts.default,
        {
          ...mockData.individualShifts.default,
          date: '2025-01-02',
          actual_start_time: '2025-01-02T09:00:00Z',
          actual_end_time: '2025-01-02T19:00:00Z'
        },
        {
          ...mockData.individualShifts.default,
          date: '2025-01-03',
          actual_start_time: '2025-01-03T09:00:00Z',
          actual_end_time: '2025-01-03T19:00:00Z'
        }
      ]

      const result = calculateShiftScore(employee, shiftOption, date, existingShifts)
      
      expect(result.factors.weeklyHoursBalanceScore).toBeLessThan(0.5)
    })

    it('should use custom weights when provided', () => {
      const employee = mockData.employees.default
      const shiftOption = mockData.shiftOptions.dayRegular
      const date = '2025-01-01'
      const existingShifts = []
      const customWeights = {
        ...DEFAULT_WEIGHTS,
        preferredCategory: 100 // Make preferred category extremely important
      }

      const result = calculateShiftScore(
        employee,
        shiftOption,
        date,
        existingShifts,
        customWeights
      )
      
      // Score should be higher than with default weights
      const defaultResult = calculateShiftScore(
        employee,
        shiftOption,
        date,
        existingShifts
      )
      expect(result.score).toBeGreaterThan(defaultResult.score)
    })
  })
}) 