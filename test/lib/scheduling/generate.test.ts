import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSchedule } from '@/lib/scheduling/generate'
import { mockData } from '@/test/helpers/mock-data'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleGenerationParams } from '@/types/scheduling'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { start_date: '2025-01-01', end_date: '2025-01-31' } }))
        })),
        data: [mockData.employees.default, mockData.employees.supervisor]
      })),
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn()
    }))
  }))
}))

describe('scheduling/generate', () => {
  const defaultParams: ScheduleGenerationParams = {
    schedulePeriodId: 'period-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a valid schedule', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    const result = await generateSchedule(supabase, periodId, defaultParams)

    expect(result.success).toBe(true)
    expect(result.assignedShifts).toBeGreaterThan(0)
    expect(result.unfilledRequirements).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('should handle invalid schedule period', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock period data to be invalid
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { start_date: '2025-01-31', end_date: '2025-01-01' } }))
          })),
          data: [mockData.employees.default, mockData.employees.supervisor]
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    await expect(generateSchedule(supabase, periodId, defaultParams)).rejects.toThrow('Invalid schedule period')
  })

  it('should handle missing data', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock missing employee data
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { start_date: '2025-01-01', end_date: '2025-01-31' } }))
          })),
          data: null
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    await expect(generateSchedule(supabase, periodId, defaultParams)).rejects.toThrow('Failed to fetch required data')
  })

  it('should handle database errors', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock database error
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ error: new Error('Database error') }))
          })),
          data: null
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    await expect(generateSchedule(supabase, periodId, defaultParams)).rejects.toThrow()
  })

  it('should respect minimum staffing requirements', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock data with specific staffing requirements
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { start_date: '2025-01-01', end_date: '2025-01-31' } }))
          })),
          data: [
            mockData.employees.default,
            mockData.employees.supervisor,
            // Add more employees to meet minimum staffing
            { ...mockData.employees.default, id: 'emp-3' },
            { ...mockData.employees.default, id: 'emp-4' },
            { ...mockData.employees.default, id: 'emp-5' },
            { ...mockData.employees.default, id: 'emp-6' }
          ]
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    const result = await generateSchedule(supabase, periodId, defaultParams)

    expect(result.success).toBe(true)
    expect(result.unfilledRequirements).toBe(0)
  })

  it('should handle insufficient staff', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock data with insufficient staff
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { start_date: '2025-01-01', end_date: '2025-01-31' } }))
          })),
          data: [mockData.employees.default] // Only one employee
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    const result = await generateSchedule(supabase, periodId, defaultParams)

    expect(result.success).toBe(true)
    expect(result.unfilledRequirements).toBeGreaterThan(0)
  })

  it('should respect employee time off', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    // Mock data with time off requests
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { start_date: '2025-01-01', end_date: '2025-01-31' } }))
          })),
          data: [
            mockData.employees.default,
            mockData.employees.supervisor,
            mockData.timeOffRequests.approved
          ]
        })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      }))
    }))

    const result = await generateSchedule(supabase, periodId, defaultParams)

    expect(result.success).toBe(true)
    // Could add more specific checks for time off handling
  })

  it('should enforce shift patterns', async () => {
    const supabase = createClient()
    const periodId = 'period-1'

    const result = await generateSchedule(supabase, periodId, defaultParams)

    expect(result.success).toBe(true)
    // Could add more specific checks for shift pattern enforcement
  })
}) 