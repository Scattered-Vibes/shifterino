import { NextRequest } from 'next/server'
import { createRateLimiter } from '@/lib/middleware/supabase-rate-limit'
import * as queryHelper from '@/lib/supabase/query-helper'

// Mock the query helper
jest.mock('@/lib/supabase/query-helper')
const mockedQueryHelper = queryHelper as jest.Mocked<typeof queryHelper>

describe('Supabase Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockRequest = {
    headers: new Headers({
      'x-forwarded-for': '127.0.0.1'
    }),
    nextUrl: {
      pathname: '/api/test'
    }
  } as unknown as NextRequest

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default config', () => {
      const limiter = createRateLimiter()
      expect(limiter.check).toBeDefined()
    })

    it('should create a rate limiter with custom config', () => {
      const limiter = createRateLimiter({
        maxRequests: 50,
        windowMs: 30000,
        keyPrefix: 'test'
      })
      expect(limiter.check).toBeDefined()
    })

    it('should throw on invalid config', () => {
      expect(() => createRateLimiter({ maxRequests: 0 })).toThrow()
    })
  })

  describe('rate limiter check', () => {
    it('should allow requests within limit', async () => {
      mockedQueryHelper.selectFromTable.mockResolvedValueOnce({
        id: 'test',
        count: 5,
        last_request: new Date().toISOString()
      })

      mockedQueryHelper.upsertTable.mockResolvedValueOnce({
        id: 'test',
        count: 6,
        last_request: new Date().toISOString()
      })

      const limiter = createRateLimiter({ maxRequests: 10 })
      const result = await limiter.check(mockRequest)

      expect(result.success).toBe(true)
      expect(result.remainingRequests).toBe(4)
    })

    it('should block requests over limit', async () => {
      mockedQueryHelper.selectFromTable.mockResolvedValueOnce({
        id: 'test',
        count: 10,
        last_request: new Date().toISOString()
      })

      const limiter = createRateLimiter({ maxRequests: 10 })
      const result = await limiter.check(mockRequest)

      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset count after window expires', async () => {
      const oldDate = new Date(Date.now() - 70000).toISOString() // 70 seconds ago
      
      mockedQueryHelper.selectFromTable.mockResolvedValueOnce({
        id: 'test',
        count: 10,
        last_request: oldDate
      })

      mockedQueryHelper.upsertTable.mockResolvedValueOnce({
        id: 'test',
        count: 1,
        last_request: new Date().toISOString()
      })

      const limiter = createRateLimiter({
        maxRequests: 10,
        windowMs: 60000 // 60 seconds
      })
      const result = await limiter.check(mockRequest)

      expect(result.success).toBe(true)
      expect(result.remainingRequests).toBe(9)
    })

    it('should handle database errors with retry', async () => {
      mockedQueryHelper.selectFromTable
        .mockRejectedValueOnce(new Error('connection timeout'))
        .mockResolvedValueOnce({
          id: 'test',
          count: 5,
          last_request: new Date().toISOString()
        })

      mockedQueryHelper.upsertTable.mockResolvedValueOnce({
        id: 'test',
        count: 6,
        last_request: new Date().toISOString()
      })

      const limiter = createRateLimiter({
        maxRetries: 2,
        baseRetryMs: 100
      })
      const result = await limiter.check(mockRequest)

      expect(result.success).toBe(true)
      expect(mockedQueryHelper.selectFromTable).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      const networkError = new Error('network error')
      mockedQueryHelper.selectFromTable.mockRejectedValue(networkError)

      const limiter = createRateLimiter({
        maxRetries: 2,
        baseRetryMs: 100
      })
      const result = await limiter.check(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limiting failed after all retry attempts')
      expect(mockedQueryHelper.selectFromTable).toHaveBeenCalledTimes(2)
    })
  })
}) 