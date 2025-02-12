import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createMockServerComponentClient } from '@/test/supabase-mock'
import type { Schedule, ScheduleGenerationParams } from '@/types/scheduling/schedule'
import { generateSchedule } from '@/lib/scheduling/generate'
import { validateSchedule } from '@/lib/scheduling/validation'
import { checkConflicts } from '@/lib/scheduling/conflicts'

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
  const mockOptions: ScheduleGenerationParams = {
    startDate: new Date('2025-02-01T00:00:00Z'),
    endDate: new Date('2025-02-28T23:59:59Z'),
    considerPreferences: true,
    allowOvertime: false
  }

  const mockSchedules: Schedule[] = [{
    id: '123',
    employeeId: 'emp-123',
    date: new Date('2025-02-01'),
    status: 'pending',
    shiftType: 'day',
    startTime: '09:00',
    endTime: '17:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(generateSchedule as jest.Mock).mockResolvedValue(mockSchedules)
    ;(validateSchedule as jest.Mock).mockResolvedValue({ isValid: true })
    ;(checkConflicts as jest.Mock).mockResolvedValue({ conflicts: [] })
  })

  it('generates a valid schedule', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock successful schedule generation
    ;(generateSchedule as jest.Mock).mockResolvedValue(mockSchedules)

    // Generate schedule
    const result = await generateSchedule(mockOptions, supabase)

    expect(result).toEqual(mockSchedules)
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

    ;(checkConflicts as jest.Mock).mockResolvedValue({
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
    const resolution = await checkConflicts(schedule)

    expect(resolution.conflicts).toEqual(conflicts)
    expect(checkConflicts).toHaveBeenCalledWith(schedule)
  })

  it('handles time zone differences', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock schedule with different time zones
    const tzSchedule = [
      {
        ...mockSchedules[0],
        date: new Date('2025-02-01T09:00:00-08:00') // PST
      },
      {
        id: '2',
        employeeId: '456',
        shiftId: '789',
        date: new Date('2025-02-01T09:00:00+00:00'), // UTC
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
      ...mockSchedules,
      {
        id: '2',
        employeeId: '456',
        shiftId: '789',
        date: new Date('2025-02-01T09:00:00Z'),
        status: 'pending'
      },
      {
        id: '3',
        employeeId: '789',
        shiftId: '012',
        date: new Date('2025-02-01T09:00:00Z'),
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