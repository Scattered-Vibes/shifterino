import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { adminMiddleware } from '@/lib/middleware/admin'
import { createRateLimiter } from '@/lib/middleware/supabase-rate-limit'

// Mock rate limiting
vi.mock('@/lib/middleware/supabase-rate-limit', () => ({
  createRateLimiter: vi.fn().mockReturnValue({
    check: vi.fn().mockResolvedValue({ success: true, retryAfter: 0 })
  })
}))

describe('Admin Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow request when rate limit is not exceeded', async () => {
    const request = new NextRequest(new URL('http://localhost/api/admin/test'))
    const mockNext = vi.fn().mockReturnValue(new NextResponse())
    NextResponse.next = mockNext

    // Call middleware
    const result = await adminMiddleware(request)

    expect(result).toBeDefined()
    expect(result.status).not.toBe(429)
  })

  it('should block request when rate limit is exceeded', async () => {
    const request = new NextRequest(new URL('http://localhost/api/admin/test'))
    const mockNext = vi.fn().mockReturnValue(new NextResponse())
    NextResponse.next = mockNext

    // Mock rate limit exceeded
    const mockRateLimiter = {
      check: vi.fn().mockResolvedValueOnce({ success: false, retryAfter: 60 })
    }
    vi.mocked(createRateLimiter).mockReturnValueOnce(mockRateLimiter)

    // Call middleware
    const result = await adminMiddleware(request)

    expect(result.status).toBe(429)
    const body = await result.json()
    expect(body).toEqual({
      error: 'Too many requests',
      retryAfter: 60
    })
  })

  it('should handle errors gracefully', async () => {
    const request = new NextRequest(new URL('http://localhost/api/admin/test'))
    const mockNext = vi.fn().mockReturnValue(new NextResponse())
    NextResponse.next = mockNext

    // Mock error
    const mockRateLimiter = {
      check: vi.fn().mockRejectedValueOnce(new Error('Test error'))
    }
    vi.mocked(createRateLimiter).mockReturnValueOnce(mockRateLimiter)

    // Call middleware
    const result = await adminMiddleware(request)

    expect(result.status).toBe(500)
    const body = await result.json()
    expect(body).toEqual({
      error: 'Internal server error'
    })
  })
}) 