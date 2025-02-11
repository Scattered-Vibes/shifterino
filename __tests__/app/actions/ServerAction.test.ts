import { vi } from 'vitest'
import { createMockServerActionClient } from '../../../test/supabase-mock'
import { updateSchedule } from '@/app/actions/schedule'
import type { Schedule } from '@/types/scheduling/schedule'

// Mock the server action
vi.mock('@/app/actions/schedule', () => ({
  updateSchedule: vi.fn()
}))

describe('Server Action', () => {
  it('successfully updates schedule', async () => {
    const mockSchedule: Schedule = {
      id: '1',
      employeeId: '123',
      shiftId: '456',
      date: new Date().toISOString(),
      status: 'approved'
    }
    
    const supabase = createMockServerActionClient()
    
    // Setup mock response
    supabase.from.mockResolvedValue({ 
      data: mockSchedule, 
      error: null 
    })

    const result = await updateSchedule(mockSchedule)
    
    expect(result).toEqual({
      success: true,
      data: mockSchedule
    })
    expect(supabase.from).toHaveBeenCalledWith('schedules')
  })

  it('handles validation errors', async () => {
    const invalidSchedule = {
      id: '1',
      // Missing required fields
    }
    
    const supabase = createMockServerActionClient()
    
    const result = await updateSchedule(invalidSchedule)
    
    expect(result).toEqual({
      success: false,
      error: expect.any(String)
    })
  })

  it('handles database errors', async () => {
    const mockSchedule: Schedule = {
      id: '1',
      employeeId: '123',
      shiftId: '456',
      date: new Date().toISOString(),
      status: 'approved'
    }
    
    const supabase = createMockServerActionClient()
    
    // Mock database error
    supabase.from.mockRejectedValue(new Error('Database error'))

    const result = await updateSchedule(mockSchedule)
    
    expect(result).toEqual({
      success: false,
      error: 'Failed to update schedule'
    })
  })
}) 