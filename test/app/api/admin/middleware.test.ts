import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/app/api/admin/middleware'
import { rateLimit } from '@/middleware/rate-limit'

// Mock rate limiting
vi.mock('@/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}))

describe('Admin Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow request when rate limit not exceeded', async () => {
    // Create request and response
    const request = new NextRequest('http://localhost/api/admin/users')
    const response = NextResponse.next()

    // Call middleware
    const result = await middleware(request)

    // Verify rate limit was checked
    expect(rateLimit).toHaveBeenCalledWith(
      request,
      response,
      expect.objectContaining({
        maxRequests: 20,
        windowMs: 60 * 1000
      })
    )

    // Verify request was allowed
    expect(result).toBe(undefined)
  })

  it('should block request when rate limit exceeded', async () => {
    // Mock rate limit exceeded
    ;(rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 429,
      headers: { 'Retry-After': '60' }
    })

    // Create request and response
    const request = new NextRequest('http://localhost/api/admin/users')
    const response = NextResponse.next()

    // Call middleware
    const result = await middleware(request)

    // Verify rate limit was checked
    expect(rateLimit).toHaveBeenCalledWith(
      request,
      response,
      expect.objectContaining({
        maxRequests: 20,
        windowMs: 60 * 1000
      })
    )

    // Verify request was blocked
    expect(result).toBeDefined()
    expect(result?.status).toBe(429)
    expect(result?.headers.get('Retry-After')).toBe('60')
  })

  it('should apply stricter rate limits for admin routes', async () => {
    // Create request and response
    const request = new NextRequest('http://localhost/api/admin/users')
    const response = NextResponse.next()

    // Call middleware
    await middleware(request)

    // Verify rate limit was called with admin config
    expect(rateLimit).toHaveBeenCalledWith(
      request,
      response,
      expect.objectContaining({
        maxRequests: 20,
        windowMs: 60 * 1000 // 1 minute
      })
    )
  })
}) 