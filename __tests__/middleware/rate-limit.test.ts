import { NextRequest } from 'next/server'
import {
  calculateRetryAfter,
  generateRateLimitKey,
  createRateLimitHeaders,
  validateConfig,
  isRetryableError
} from '@/lib/middleware/rate-limit-core'

describe('Rate Limit Core', () => {
  describe('calculateRetryAfter', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateRetryAfter(1, 'exponential', 1000)).toBe(1000)
      expect(calculateRetryAfter(2, 'exponential', 1000)).toBe(2000)
      expect(calculateRetryAfter(3, 'exponential', 1000)).toBe(4000)
      expect(calculateRetryAfter(4, 'exponential', 1000)).toBe(8000)
    })

    it('should calculate linear backoff correctly', () => {
      expect(calculateRetryAfter(1, 'linear', 1000)).toBe(1000)
      expect(calculateRetryAfter(2, 'linear', 1000)).toBe(2000)
      expect(calculateRetryAfter(3, 'linear', 1000)).toBe(3000)
      expect(calculateRetryAfter(4, 'linear', 1000)).toBe(4000)
    })

    it('should return fixed backoff correctly', () => {
      expect(calculateRetryAfter(1, 'fixed', 1000)).toBe(1000)
      expect(calculateRetryAfter(2, 'fixed', 1000)).toBe(1000)
      expect(calculateRetryAfter(3, 'fixed', 1000)).toBe(1000)
    })

    it('should cap retry time at 60 seconds', () => {
      expect(calculateRetryAfter(7, 'exponential', 1000)).toBe(60000)
      expect(calculateRetryAfter(61, 'linear', 1000)).toBe(60000)
    })
  })

  describe('generateRateLimitKey', () => {
    it('should generate correct key format', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '127.0.0.1'
        }),
        nextUrl: {
          pathname: '/api/test'
        }
      } as unknown as NextRequest

      const key = generateRateLimitKey(mockRequest, 'test')
      expect(key).toBe('rate_limit:test:127.0.0.1:/api/test')
    })

    it('should handle missing IP headers', () => {
      const mockRequest = {
        headers: new Headers({}),
        nextUrl: {
          pathname: '/api/test'
        }
      } as unknown as NextRequest

      const key = generateRateLimitKey(mockRequest, 'test')
      expect(key).toBe('rate_limit:test:anonymous:/api/test')
    })
  })

  describe('createRateLimitHeaders', () => {
    it('should create correct headers', () => {
      const headers = createRateLimitHeaders(100, 99, 1234567890, 30)
      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('99')
      expect(headers['X-RateLimit-Reset']).toBe('1234567890')
      expect(headers['Retry-After']).toBe('30')
    })

    it('should omit Retry-After when not provided', () => {
      const headers = createRateLimitHeaders(100, 99, 1234567890)
      expect(headers['Retry-After']).toBeUndefined()
    })
  })

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = validateConfig({
        maxRequests: 100,
        windowMs: 60000,
        maxRetries: 3,
        baseRetryMs: 1000
      })
      expect(config.maxRequests).toBe(100)
      expect(config.windowMs).toBe(60000)
      expect(config.maxRetries).toBe(3)
      expect(config.baseRetryMs).toBe(1000)
    })

    it('should throw on invalid config values', () => {
      expect(() => validateConfig({ maxRequests: 0 })).toThrow()
      expect(() => validateConfig({ windowMs: 0 })).toThrow()
      expect(() => validateConfig({ maxRetries: 0 })).toThrow()
      expect(() => validateConfig({ baseRetryMs: 0 })).toThrow()
    })
  })

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('network error'))).toBe(true)
      expect(isRetryableError(new Error('connection timeout'))).toBe(true)
    })

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(new Error('validation failed'))).toBe(false)
      expect(isRetryableError('string error')).toBe(false)
      expect(isRetryableError(null)).toBe(false)
    })
  })
}) 