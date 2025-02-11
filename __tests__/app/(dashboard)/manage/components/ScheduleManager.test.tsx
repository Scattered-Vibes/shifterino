'use client'

import * as React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { ScheduleManager } from '@/app/(dashboard)/manage/components/ScheduleManager'
import { createMockSupabaseClient } from '@/test/supabase-mock'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { EventApi } from '@fullcalendar/core'
import { toast } from '@/components/ui/use-toast'
import type { Database } from '@/types/supabase/database'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Shift = Database['public']['Tables']['individual_shifts']['Row']

// Mock the query client
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}))

// Mock toast notifications
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}))

// Mock FullCalendar with improved type safety
vi.mock('@fullcalendar/react', () => ({
  default: vi.fn(({ eventDrop, eventResize, events }) => {
    const createMockEvent = (id: string, start: Date | null, end: Date | null) => ({
      id,
      start,
      end,
      extendedProps: { 
        employeeId: 'emp-1',
        shiftOptionId: 'option-1'
      },
      title: `Shift ${id}`
    })

    return (
      <div data-testid="fullcalendar">
        {events.map((event: EventApi) => (
          <div 
            key={event.id} 
            data-testid={`event-${event.id}`} 
            data-start={event.start?.toISOString()} 
            data-end={event.end?.toISOString()}
          >
            {event.title}
          </div>
        ))}
        <button 
          data-testid="trigger-event-drop" 
          onClick={() => eventDrop({
            event: createMockEvent(
              'shift-1',
              new Date('2024-03-15T09:00:00'),
              new Date('2024-03-15T17:00:00')
            ),
            oldEvent: createMockEvent(
              'shift-1',
              new Date('2024-03-15T08:00:00'),
              new Date('2024-03-15T16:00:00')
            ),
            revert: () => {}
          })}
        >
          Simulate Drop
        </button>
        <button 
          data-testid="trigger-event-drop-error" 
          onClick={() => eventDrop({
            event: createMockEvent('shift-1', null, null),
            oldEvent: createMockEvent(
              'shift-1',
              new Date('2024-03-15T08:00:00'),
              new Date('2024-03-15T16:00:00')
            ),
            revert: () => {}
          })}
        >
          Simulate Drop Error
        </button>
        <button 
          data-testid="trigger-event-resize" 
          onClick={() => eventResize({
            event: createMockEvent(
              'shift-1',
              new Date('2024-03-15T09:00:00'),
              new Date('2024-03-15T18:00:00')
            ),
            oldEvent: createMockEvent(
              'shift-1',
              new Date('2024-03-15T09:00:00'),
              new Date('2024-03-15T17:00:00')
            ),
            revert: () => {}
          })}
        >
          Simulate Resize
        </button>
      </div>
    )
  })
}))

describe('ScheduleManager', () => {
  let mockSupabase = createMockSupabaseClient()
  const queryClient = vi.mocked(useQueryClient())

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  const mockShifts: Shift[] = [
    {
      id: 'shift-1',
      employee_id: 'emp-1',
      actual_start_time: '2024-03-15T09:00:00',
      actual_end_time: '2024-03-15T17:00:00',
      actual_hours_worked: 8,
      shift_option_id: 'option-1',
      break_duration_minutes: 30,
      break_end_time: '2024-03-15T13:30:00',
      break_start_time: '2024-03-15T13:00:00',
      created_at: '2024-03-15T00:00:00',
      updated_at: '2024-03-15T00:00:00',
      is_overtime: false,
      is_regular_schedule: true,
      notes: null,
      status: 'scheduled',
      date: '2024-03-15',
      fatigue_level: 0,
      schedule_conflict_notes: null,
      schedule_period_id: 'period-1',
      shift_score: 0,
      supervisor_approved_at: null,
      supervisor_approved_by: null
    }
  ]

  // Create a type-safe mock of RealtimeChannel
  const createMockRealtimeChannel = () => ({
    subscribe: vi.fn().mockResolvedValue('ok'),
    unsubscribe: vi.fn().mockResolvedValue('ok'),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue({ status: 'ok' }),
  }) as unknown as RealtimeChannel

  it('should handle event drop and update shift times', async () => {
    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: [mockShifts[0]],
        error: null
      })
    })

    render(<ScheduleManager shifts={mockShifts} />)
    
    fireEvent.click(screen.getByTestId('trigger-event-drop'))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('individual_shifts')
      expect(mockFrom().update).toHaveBeenCalledWith({
        actual_start_time: '2024-03-15T09:00:00',
        actual_end_time: '2024-03-15T17:00:00',
        actual_hours_worked: 8,
        shift_option_id: 'option-1'
      })
    })
  })

  it('should handle event drop errors', async () => {
    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Failed to update shift')
      })
    })

    render(<ScheduleManager shifts={mockShifts} />)
    
    fireEvent.click(screen.getByTestId('trigger-event-drop-error'))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update shift'
      })
    })
  })

  it('should handle event resize and update shift times', async () => {
    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: [{
          ...mockShifts[0],
          actual_end_time: '2024-03-15T18:00:00',
          actual_hours_worked: 9
        }],
        error: null
      })
    })

    render(<ScheduleManager shifts={mockShifts} />)
    
    fireEvent.click(screen.getByTestId('trigger-event-resize'))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('individual_shifts')
      expect(mockFrom().update).toHaveBeenCalledWith({
        actual_end_time: '2024-03-15T18:00:00',
        actual_hours_worked: 9
      })
    })
  })

  it('should handle real-time updates through subscription', async () => {
    const mockChannel = createMockRealtimeChannel()
    ;(mockSupabase.channel as jest.Mock).mockReturnValue(mockChannel)
    
    render(<ScheduleManager shifts={mockShifts} />)

    // Get the callback function that was passed to channel.on()
    const onCallback = vi.mocked(mockChannel.on).mock.calls[0][2] as (payload: RealtimePostgresChangesPayload<Shift>) => void
    
    // Simulate a real-time update
    onCallback({
      eventType: "UPDATE",
      schema: "public",
      table: "individual_shifts",
      commit_timestamp: "2024-03-15T10:00:00",
      errors: [],
      new: {
        id: 'shift-1',
        actual_start_time: '2024-03-15T10:00:00',
        actual_end_time: '2024-03-15T18:00:00'
      } as Shift,
      old: mockShifts[0]
    })

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['shifts'] })
    })
  })

  it('should cleanup subscription on unmount', () => {
    const mockChannel = createMockRealtimeChannel()
    ;(mockSupabase.channel as jest.Mock).mockReturnValue(mockChannel)
    
    const { unmount } = render(<ScheduleManager shifts={mockShifts} />)
    
    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })
}) 