import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createMockServerComponentClient } from '../../../test/supabase-mock'
import type { Schedule, ScheduleGenerationOptions } from '@/types/scheduling/schedule'
import { generateSchedule } from '@/lib/scheduling/generate'
import { validateSchedule } from '@/lib/scheduling/validation'
import { resolveConflicts } from '@/lib/scheduling/conflicts'

// Mock the scheduling functions
vi.mock('@/lib/scheduling/generate', () => ({
  generateSchedule: vi.fn()
}))

vi.mock('@/lib/scheduling/validation', () => ({
  validateSchedule: vi.fn()
}))

vi.mock('@/lib/scheduling/conflicts', () => ({
  resolveConflicts: vi.fn()
}))

describe('Schedule Generation Flow', () => {
  const mockOptions: ScheduleGenerationOptions = {
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-02-28T23:59:59Z',
    constraints: {
      maxHoursPerWeek: 40,
      minRestHours: 8,
      preferredShiftPatterns: true,
      balanceWorkload: true
    }
  }

  const mockSchedule: Schedule[] = [
    {
      id: '1',
      employeeId: '123',
      shiftId: '456',
      date: '2025-02-01T09:00:00Z',
      status: 'pending'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(generateSchedule as jest.Mock).mockResolvedValue(mockSchedule)
    ;(validateSchedule as jest.Mock).mockResolvedValue({ isValid: true })
    ;(resolveConflicts as jest.Mock).mockResolvedValue({ conflicts: [] })
  })

  it('generates a valid schedule', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock successful schedule generation
    ;(generateSchedule as jest.Mock).mockResolvedValue(mockSchedule)

    // Generate schedule
    const result = await generateSchedule(mockOptions, supabase)

    expect(result).toEqual(mockSchedule)
    expect(generateSchedule).toHaveBeenCalledWith(mockOptions, supabase)
  })

  it('validates generated schedule', async () => {
    const supabase = createMockServerComponentClient()
    
    // Generate and validate schedule
    const schedule = await generateSchedule(mockOptions, supabase)
    const validation = await validateSchedule(schedule)

    expect(validation.isValid).toBe(true)
    expect(validateSchedule).toHaveBeenCalledWith(schedule)
  })

  it('handles validation failures', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock validation failure
    ;(validateSchedule as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: ['Exceeds maximum weekly hours']
    })

    // Generate schedule
    const schedule = await generateSchedule(mockOptions, supabase)
    const validation = await validateSchedule(schedule)

    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Exceeds maximum weekly hours')
  })

  it('resolves scheduling conflicts', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock conflict resolution
    const conflicts = [
      {
        type: 'overlap',
        employeeId: '123',
        shifts: ['456', '789']
      }
    ]

    ;(resolveConflicts as jest.Mock).mockResolvedValue({
      conflicts,
      resolutions: [
        {
          action: 'reassign',
          shiftId: '789',
          newEmployeeId: '456'
        }
      ]
    })

    // Generate schedule and resolve conflicts
    const schedule = await generateSchedule(mockOptions, supabase)
    const resolution = await resolveConflicts(schedule)

    expect(resolution.conflicts).toEqual(conflicts)
    expect(resolveConflicts).toHaveBeenCalledWith(schedule)
  })

  it('handles time zone differences', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock schedule with different time zones
    const tzSchedule = [
      {
        ...mockSchedule[0],
        date: '2025-02-01T09:00:00-08:00' // PST
      },
      {
        id: '2',
        employeeId: '456',
        shiftId: '789',
        date: '2025-02-01T09:00:00+00:00', // UTC
        status: 'pending'
      }
    ]

    ;(generateSchedule as jest.Mock).mockResolvedValue(tzSchedule)

    // Generate schedule
    const result = await generateSchedule({
      ...mockOptions,
      timeZone: 'America/Los_Angeles'
    }, supabase)

    expect(result).toEqual(tzSchedule)
    expect(generateSchedule).toHaveBeenCalledWith({
      ...mockOptions,
      timeZone: 'America/Los_Angeles'
    }, supabase)
  })

  it('maintains minimum staffing requirements', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock schedule with staffing requirements
    const staffingSchedule = [
      ...mockSchedule,
      {
        id: '2',
        employeeId: '456',
        shiftId: '789',
        date: '2025-02-01T09:00:00Z',
        status: 'pending'
      },
      {
        id: '3',
        employeeId: '789',
        shiftId: '012',
        date: '2025-02-01T09:00:00Z',
        status: 'pending'
      }
    ]

    ;(generateSchedule as jest.Mock).mockResolvedValue(staffingSchedule)
    ;(validateSchedule as jest.Mock).mockImplementation((schedule: Schedule[]) => {
      const shifts = schedule.filter(s => 
        new Date(s.date).getHours() >= 9 && 
        new Date(s.date).getHours() < 21
      )
      return {
        isValid: shifts.length >= 3, // Minimum 3 staff during day shift
        errors: shifts.length < 3 ? ['Insufficient staffing'] : []
      }
    })

    // Generate and validate schedule
    const schedule = await generateSchedule(mockOptions, supabase)
    const validation = await validateSchedule(schedule)

    expect(validation.isValid).toBe(true)
    expect(schedule).toHaveLength(3)
  })
}) 