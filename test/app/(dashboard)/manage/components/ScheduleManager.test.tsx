import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { ScheduleManager } from '@/app/(dashboard)/manage/components/ScheduleManager';
import { createMockSupabaseClient } from '@/test/helpers/supabase-mock';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { EventApi } from '@fullcalendar/core';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimeChannelSendResponse, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

type Shift = Database['public']['Tables']['individual_shifts']['Row'];

// Mock the query client
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}));

// Mock toast notifications
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock FullCalendar
vi.mock('@fullcalendar/react', () => ({
  default: vi.fn(({ eventDrop, eventResize, events }) => (
    <div data-testid="fullcalendar">
      {events.map((event: EventApi) => (
        <div key={event.id} data-testid={`event-${event.id}`} data-start={event.start} data-end={event.end}>
          {event.title}
        </div>
      ))}
      <button 
        data-testid="trigger-event-drop" 
        onClick={() => eventDrop({
          event: {
            id: 'shift-1',
            start: new Date('2024-03-15T09:00:00'),
            end: new Date('2024-03-15T17:00:00'),
            extendedProps: { 
              employeeId: 'emp-1',
              shiftOptionId: 'option-1'
            }
          },
          oldEvent: {
            start: new Date('2024-03-15T08:00:00'),
            end: new Date('2024-03-15T16:00:00')
          }
        })}
      >
        Simulate Drop
      </button>
      <button 
        data-testid="trigger-event-drop-null" 
        onClick={() => eventDrop({
          event: {
            id: 'shift-1',
            start: null,
            end: null,
            extendedProps: { 
              employeeId: 'emp-1',
              shiftOptionId: 'option-1'
            }
          },
          oldEvent: {
            start: new Date('2024-03-15T08:00:00'),
            end: new Date('2024-03-15T16:00:00')
          }
        })}
      >
        Simulate Drop with Null Times
      </button>
      <button 
        data-testid="trigger-event-resize" 
        onClick={() => eventResize({
          event: {
            id: 'shift-1',
            start: new Date('2024-03-15T09:00:00'),
            end: new Date('2024-03-15T18:00:00'),
            extendedProps: { 
              employeeId: 'emp-1',
              shiftOptionId: 'option-1'
            }
          },
          oldEvent: {
            start: new Date('2024-03-15T09:00:00'),
            end: new Date('2024-03-15T17:00:00')
          }
        })}
      >
        Simulate Resize
      </button>
      <button 
        data-testid="trigger-event-resize-null" 
        onClick={() => eventResize({
          event: {
            id: 'shift-1',
            start: null,
            end: null,
            extendedProps: { 
              employeeId: 'emp-1',
              shiftOptionId: 'option-1'
            }
          },
          oldEvent: {
            start: new Date('2024-03-15T09:00:00'),
            end: new Date('2024-03-15T17:00:00')
          }
        })}
      >
        Simulate Resize with Null Times
      </button>
    </div>
  ))
}));

describe('ScheduleManager', () => {
  let mockSupabase = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

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
  ];

  // Create a type-safe mock of RealtimeChannel
  function createMockRealtimeChannel(): RealtimeChannel {
    return {
      subscribe: vi.fn().mockImplementation((callback?: (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => void) => {
        if (callback) callback('SUBSCRIBED');
        return Promise.resolve('ok');
      }),
      unsubscribe: vi.fn().mockResolvedValue('ok'),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      send: vi.fn().mockImplementation(() => Promise.resolve({ status: 'ok' } as RealtimeChannelSendResponse)),
      track: vi.fn().mockReturnThis(),
      untrack: vi.fn().mockReturnThis(),
      disconnect: vi.fn().mockResolvedValue('ok'),
      // Required RealtimeChannel properties
      topic: 'realtime:*',
      params: {},
      socket: {
        accessToken: null,
        apiKey: null,
        apiUrl: '',
        channels: [],
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: false,
        maxReconnectAttempts: 0,
        reconnectAttempts: 0,
        transport: null,
        updateAuth: vi.fn(),
        listeners: {
          open: [],
          close: [],
          error: [],
          message: [],
          connecting: [],
          reconnecting: [],
          reconnected: [],
          disconnected: []
        }
      },
      bindings: {},
      presenceState: {},
      joinedOnce: false,
      state: 'closed',
      pendingTimer: null,
      reconnectTimer: null,
      rejoinTimer: null,
      timeout: 10000,
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn()
    } as RealtimeChannel;
  }

  const _mockChannel = createMockRealtimeChannel();

  it('should handle event drop and update shift times', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: [mockShifts[0]],
        error: null
      })
    });

    render(<ScheduleManager shifts={mockShifts} />);
    
    fireEvent.click(screen.getByTestId('trigger-event-drop'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('individual_shifts');
      expect(mockFrom().update).toHaveBeenCalledWith({
        actual_start_time: '2024-03-15T09:00:00',
        actual_end_time: '2024-03-15T17:00:00',
        actual_hours_worked: 8,
        shift_option_id: 'option-1'
      });
    });
  });

  it('should handle event resize and update shift times', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
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
    });

    render(<ScheduleManager shifts={mockShifts} />);
    
    fireEvent.click(screen.getByTestId('trigger-event-resize'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('individual_shifts');
      expect(mockFrom().update).toHaveBeenCalledWith({
        actual_start_time: '2024-03-15T09:00:00',
        actual_end_time: '2024-03-15T18:00:00',
        actual_hours_worked: 9,
        shift_option_id: 'option-1'
      });
    });
  });

  it('should handle null event start/end times gracefully', async () => {
    render(<ScheduleManager shifts={mockShifts} />);
    
    fireEvent.click(screen.getByTestId('trigger-event-drop-null'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Invalid event times',
        variant: 'destructive'
      });
    });

    fireEvent.click(screen.getByTestId('trigger-event-resize-null'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Invalid event times',
        variant: 'destructive'
      });
    });
  });

  it('should handle database errors during update', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })
    });

    render(<ScheduleManager shifts={mockShifts} />);
    
    fireEvent.click(screen.getByTestId('trigger-event-drop'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update shift: Database error',
        variant: 'destructive'
      });
    });
  });

  it('should handle real-time updates through subscription', async () => {
    const queryClient = vi.mocked(useQueryClient());
    
    render(<ScheduleManager shifts={mockShifts} />);

    // Simulate real-time update
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      // Add required RealtimeChannel properties
      topic: 'realtime:*',
      params: {},
      socket: {} as any,
      bindings: {},
      state: 'SUBSCRIBED',
      unsubscribe: vi.fn(),
      send: vi.fn()
    } as RealtimeChannel;

    mockSupabase.channel.mockReturnValue(mockChannel);

    // Trigger the subscription callback
    const [[, , callback]] = mockChannel.on.mock.calls;
    callback({
      new: {
        id: 'shift-1',
        actual_start_time: '2024-03-15T10:00:00',
        actual_end_time: '2024-03-15T18:00:00'
      }
    });

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['shifts'] });
    });
  });

  it('should filter out shifts with null times', () => {
    const shiftsWithNull: Shift[] = [
      {
        ...mockShifts[0],
        id: 'shift-1',
        actual_start_time: null,
        actual_end_time: '2024-03-15T17:00:00'
      },
      {
        ...mockShifts[0],
        id: 'shift-2',
        actual_start_time: '2024-03-15T09:00:00',
        actual_end_time: null
      },
      {
        ...mockShifts[0],
        id: 'shift-3',
        actual_start_time: '2024-03-15T09:00:00',
        actual_end_time: '2024-03-15T17:00:00'
      }
    ];

    render(<ScheduleManager shifts={shiftsWithNull} />);

    expect(screen.queryByTestId('event-shift-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('event-shift-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-shift-3')).toBeInTheDocument();
  });
}); 