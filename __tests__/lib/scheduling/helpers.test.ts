import { describe, it, expect } from 'vitest'
import { 
  getAvailableEmployees,
  getApplicableRequirements,
  getMatchingShiftOptions,
  validateSchedulePeriod
} from '@/lib/scheduling/helpers'
import { mockData } from '@/test/helpers/mock-data'

describe('scheduling/helpers', () => {
  describe('getAvailableEmployees', () => {
    it('should return all employees when no time off requests exist', () => {
      const employees = [mockData.employees.default, mockData.employees.supervisor]
      const date = '2025-01-01'
      const timeOffRequests = []

      const available = getAvailableEmployees(employees, date, timeOffRequests)
      expect(available).toEqual(employees)
    })

    it('should exclude employees with approved time off', () => {
      const employees = [mockData.employees.default, mockData.employees.supervisor]
      const date = '2025-01-15' // Within default employee's time off
      const timeOffRequests = [mockData.timeOffRequests.approved]

      const available = getAvailableEmployees(employees, date, timeOffRequests)
      expect(available).toEqual([mockData.employees.supervisor])
    })

    it('should include employees with pending time off', () => {
      const employees = [mockData.employees.default, mockData.employees.supervisor]
      const date = '2025-02-03' // Within supervisor's pending time off
      const timeOffRequests = [mockData.timeOffRequests.pending]

      const available = getAvailableEmployees(employees, date, timeOffRequests)
      expect(available).toEqual(employees)
    })
  })

  describe('getApplicableRequirements', () => {
    it('should return non-holiday requirements for regular days', () => {
      const requirements = Object.values(mockData.staffingRequirements)
      const date = '2025-01-01'
      const isHoliday = false

      const applicable = getApplicableRequirements(date, requirements, isHoliday)
      expect(applicable).toEqual(requirements)
    })

    it('should return holiday requirements for holidays', () => {
      const requirements = Object.values(mockData.staffingRequirements)
      const holidayRequirement = {
        ...mockData.staffingRequirements.dayPeak,
        id: 'holiday-1',
        is_holiday: true,
        min_total_staff: 10 // Higher staffing for holidays
      }
      const date = '2025-01-01'
      const isHoliday = true

      const applicable = getApplicableRequirements(
        date, 
        [...requirements, holidayRequirement],
        isHoliday
      )
      expect(applicable).toEqual([holidayRequirement])
    })
  })

  describe('getMatchingShiftOptions', () => {
    it('should return shift options matching requirement time block', () => {
      const requirement = mockData.staffingRequirements.dayEarly
      const shiftOptions = Object.values(mockData.shiftOptions)

      const matching = getMatchingShiftOptions(requirement, shiftOptions)
      expect(matching).toEqual([mockData.shiftOptions.dayEarly])
    })

    it('should return empty array when no shifts match', () => {
      const requirement = {
        ...mockData.staffingRequirements.dayEarly,
        time_block_start: '02:00',
        time_block_end: '04:00'
      }
      const shiftOptions = Object.values(mockData.shiftOptions)

      const matching = getMatchingShiftOptions(requirement, shiftOptions)
      expect(matching).toEqual([])
    })
  })

  describe('validateSchedulePeriod', () => {
    it('should return true for valid schedule period', () => {
      const startDate = '2025-01-01'
      const endDate = '2025-03-31'

      const isValid = validateSchedulePeriod(startDate, endDate)
      expect(isValid).toBe(true)
    })

    it('should return false for invalid dates', () => {
      const startDate = 'invalid'
      const endDate = '2025-03-31'

      const isValid = validateSchedulePeriod(startDate, endDate)
      expect(isValid).toBe(false)
    })

    it('should return false when end date is before start date', () => {
      const startDate = '2025-03-31'
      const endDate = '2025-01-01'

      const isValid = validateSchedulePeriod(startDate, endDate)
      expect(isValid).toBe(false)
    })

    it('should return false for period longer than 6 months', () => {
      const startDate = '2025-01-01'
      const endDate = '2025-08-01'

      const isValid = validateSchedulePeriod(startDate, endDate)
      expect(isValid).toBe(false)
    })
  })
}) 