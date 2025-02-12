import { render, screen } from '@testing-library/react'
import { createMockServerComponentClient } from '../../../test/supabase-mock'
import { vi } from 'vitest'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import ServerComponent from '@/components/ServerComponent'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock the server component
vi.mock('@/components/ServerComponent', () => {
  return {
    default: async ({ supabase }: { supabase: SupabaseClient }) => {
      const data = await supabase.from('test').select('*')
      return <div data-testid="server-component">{JSON.stringify(data)}</div>
    }
  }
})

describe('ServerComponent', () => {
  it('renders with streaming data', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    const supabase = createMockServerComponentClient()
    
    // Setup mock response
    supabase.from.mockResolvedValue({ 
      data: mockData, 
      error: null 
    })

    render(await ServerComponent({ supabase }))
    
    expect(screen.getByTestId('server-component')).toBeInTheDocument()
  })

  it('handles loading state', async () => {
    const supabase = createMockServerComponentClient()
    
    // Delay the response to test loading state
    supabase.from.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({ data: [], error: null }), 
          1000
        )
      )
    )

    render(
      <Suspense fallback={<div data-testid="loading">Loading...</div>}>
        {await ServerComponent({ supabase })}
      </Suspense>
    )
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    const supabase = createMockServerComponentClient()
    
    // Mock error response
    supabase.from.mockRejectedValue(new Error('Failed to fetch'))

    render(
      <ErrorBoundary fallback={<div data-testid="error">Error occurred</div>}>
        {await ServerComponent({ supabase })}
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })
}) 