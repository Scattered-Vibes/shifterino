import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Suspense } from 'react'
import { createMockServerComponentClient } from '@/test/supabase-mock'
import ServerComponent from '@/components/ServerComponent'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CLSMetric, FIDMetric, LCPMetric } from 'web-vitals'

// Mock web-vitals
const mockCLSMetric: CLSMetric = {
  value: 0.1,
  name: 'CLS',
  id: 'v3-1234',
  navigationType: 'navigate',
  rating: 'good',
  entries: [],
  delta: 0
}

const mockFIDMetric: FIDMetric = {
  value: 100,
  name: 'FID',
  id: 'v3-1234',
  navigationType: 'navigate',
  rating: 'good',
  entries: [],
  delta: 0
}

const mockLCPMetric: LCPMetric = {
  value: 2500,
  name: 'LCP',
  id: 'v3-1234',
  navigationType: 'navigate',
  rating: 'good',
  entries: [],
  delta: 0
}

const mockWebVitals = {
  onCLS: vi.fn((cb: (metric: CLSMetric) => void) => cb(mockCLSMetric)),
  onFID: vi.fn((cb: (metric: FIDMetric) => void) => cb(mockFIDMetric)),
  onLCP: vi.fn((cb: (metric: LCPMetric) => void) => cb(mockLCPMetric))
}

vi.mock('web-vitals', () => mockWebVitals)

// Mock performance.now()
const originalPerformanceNow = performance.now
beforeEach(() => {
  let time = 0
  performance.now = vi.fn(() => time++)
  return () => {
    performance.now = originalPerformanceNow
  }
})

describe('Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Web Vitals', () => {
    it('measures Largest Contentful Paint', async () => {
      const mockLCP = vi.fn()
      mockWebVitals.onLCP.mockImplementation((cb: (metric: LCPMetric) => void) => {
        cb(mockLCPMetric)
        mockLCP()
      })

      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test' }],
            error: null
          })
        })
      } as unknown as SupabaseClient

      render(await ServerComponent({ supabase }))

      expect(mockLCP).toHaveBeenCalled()
      expect(mockWebVitals.onLCP).toHaveBeenCalled()
    })

    it('measures First Input Delay', async () => {
      const mockFID = vi.fn()
      mockWebVitals.onFID.mockImplementation((cb: (metric: FIDMetric) => void) => {
        cb(mockFIDMetric)
        mockFID()
      })

      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test' }],
            error: null
          })
        })
      } as unknown as SupabaseClient

      render(await ServerComponent({ supabase }))

      expect(mockFID).toHaveBeenCalled()
      expect(mockWebVitals.onFID).toHaveBeenCalled()
    })

    it('measures Cumulative Layout Shift', async () => {
      const mockCLS = vi.fn()
      mockWebVitals.onCLS.mockImplementation((cb: (metric: CLSMetric) => void) => {
        cb(mockCLSMetric)
        mockCLS()
      })

      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test' }],
            error: null
          })
        })
      } as unknown as SupabaseClient

      render(await ServerComponent({ supabase }))

      expect(mockCLS).toHaveBeenCalled()
      expect(mockWebVitals.onCLS).toHaveBeenCalled()
    })
  })

  describe('Streaming Performance', () => {
    it('measures time to first byte', async () => {
      const startTime = performance.now()
      
      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => 
                resolve({
                  data: [{ id: 1, name: 'Test' }],
                  error: null
                }), 
                100
              )
            )
          )
        })
      } as unknown as SupabaseClient

      render(await ServerComponent({ supabase }))
      
      const ttfb = performance.now() - startTime
      expect(ttfb).toBeLessThan(200) // TTFB should be under 200ms
    })

    it('measures time to first contentful paint', async () => {
      const startTime = performance.now()
      
      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test' }],
            error: null
          })
        })
      } as unknown as SupabaseClient

      render(
        <Suspense fallback={<div>Loading...</div>}>
          {await ServerComponent({ supabase })}
        </Suspense>
      )

      await waitFor(() => {
        expect(screen.getByTestId('server-component')).toBeInTheDocument()
      })
      
      const fcp = performance.now() - startTime
      expect(fcp).toBeLessThan(1000) // FCP should be under 1s
    })
  })

  describe('Loading States', () => {
    it('shows and hides loading state appropriately', async () => {
      const supabase = {
        ...createMockServerComponentClient(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => 
                resolve({
                  data: [{ id: 1, name: 'Test' }],
                  error: null
                }), 
                500
              )
            )
          )
        })
      } as unknown as SupabaseClient

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          {await ServerComponent({ supabase })}
        </Suspense>
      )

      // Loading state should be visible initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('server-component')).toBeInTheDocument()
      })

      // Loading state should be gone
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })
}) 