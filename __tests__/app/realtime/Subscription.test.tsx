import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createMockRealtimeClient } from '../../../test/supabase-mock'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

interface RealtimePayload {
  new: Record<string, unknown>
  old?: Record<string, unknown>
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

type MockSupabaseClient = {
  channel: (name: string) => RealtimeChannel
  removeChannel: (channel: RealtimeChannel) => Promise<'ok' | 'timed out' | 'error'>
}

// Mock component that uses real-time subscription
const RealtimeComponent = ({ 
  supabase 
}: { 
  supabase: MockSupabaseClient
}) => {
  const [data, setData] = useState<RealtimePayload[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules'
      }, (payload: RealtimePayload) => {
        setData(prev => [...prev, payload])
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div data-testid="realtime-component">
      {data.map((item: RealtimePayload, index: number) => (
        <div key={index} data-testid="realtime-item">
          {JSON.stringify(item)}
        </div>
      ))}
    </div>
  )
}

describe('Realtime Subscriptions', () => {
  let mockChannel: RealtimeChannel & { 
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
  }
  let supabase: MockSupabaseClient

  beforeEach(() => {
    const client = createMockRealtimeClient()
    mockChannel = client.channel('test-channel') as typeof mockChannel
    
    supabase = {
      channel: client.channel,
      removeChannel: vi.fn().mockResolvedValue('ok')
    }
  })

  it('subscribes to channel successfully', () => {
    render(<RealtimeComponent supabase={supabase} />)
    
    expect(supabase.channel).toHaveBeenCalledWith('test-channel')
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('handles incoming messages', async () => {
    const mockPayload: RealtimePayload = {
      new: { id: 1, status: 'approved' },
      old: { id: 1, status: 'pending' },
      eventType: 'UPDATE'
    }

    render(<RealtimeComponent supabase={supabase} />)

    // Simulate receiving a message
    const callback = mockChannel.on.mock.calls[0][2]
    callback(mockPayload)

    await waitFor(() => {
      expect(screen.getByTestId('realtime-item')).toHaveTextContent(
        JSON.stringify(mockPayload)
      )
    })
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = render(<RealtimeComponent supabase={supabase} />)
    
    unmount()
    
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('handles multiple events', async () => {
    const mockPayloads: RealtimePayload[] = [
      {
        new: { id: 1, status: 'approved' },
        old: { id: 1, status: 'pending' },
        eventType: 'UPDATE'
      },
      {
        new: { id: 2, status: 'rejected' },
        eventType: 'INSERT'
      }
    ]

    render(<RealtimeComponent supabase={supabase} />)

    // Simulate receiving multiple messages
    const callback = mockChannel.on.mock.calls[0][2]
    mockPayloads.forEach(payload => callback(payload))

    await waitFor(() => {
      const items = screen.getAllByTestId('realtime-item')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent(JSON.stringify(mockPayloads[0]))
      expect(items[1]).toHaveTextContent(JSON.stringify(mockPayloads[1]))
    })
  })

  it('handles subscription errors', async () => {
    const mockError = new Error('Subscription failed')
    mockChannel.subscribe.mockRejectedValue(mockError)

    const consoleSpy = vi.spyOn(console, 'error')
    
    render(<RealtimeComponent supabase={supabase} />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to subscribe to channel:',
        mockError
      )
    })
  })
}) 