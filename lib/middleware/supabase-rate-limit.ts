import { NextRequest } from 'next/server'
import {
  type RateLimitConfig,
  type RateLimitResult,
  generateRateLimitKey,
  calculateRetryAfter,
  isRetryableError,
  validateConfig,
  debug,
  errorLog
} from './rate-limit-core'
import { selectFromTable, upsertTable } from '../supabase/query-helper'
import type { Database } from '@/types/supabase/database'

type RateLimitEntry = Database['public']['Tables']['rate_limits']['Row']

export interface RateLimiter {
  check: (request: NextRequest) => Promise<RateLimitResult>
}

/**
 * Create a rate limiter instance with custom configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}): RateLimiter {
  const finalConfig = validateConfig(config)

  return {
    check: async (request: NextRequest): Promise<RateLimitResult> => {
      const key = generateRateLimitKey(request, finalConfig.keyPrefix)
      debug('Checking rate limit for key:', key)

      let attempt = 1
      while (attempt <= (finalConfig.maxRetries || 1)) {
        try {
          // Check current rate limit status
          let rateLimitData: RateLimitEntry | null = null
          try {
            rateLimitData = await selectFromTable('rate_limits', {
              eq: { id: key },
              isServer: true
            })
          } catch (error) {
            if (!isRetryableError(error)) {
              throw error
            }
          }

          const now = Date.now()
          let count = 1
          const resetTime = now + finalConfig.windowMs

          // Get the most recent rate limit entry if it exists
          if (rateLimitData) {
            debug('Found existing rate limit data:', rateLimitData)
            const lastRequest = new Date(rateLimitData.last_request).getTime()
            if (now - lastRequest < finalConfig.windowMs) {
              count = rateLimitData.count + 1
              debug('Incrementing count within window:', { count, windowMs: finalConfig.windowMs })
            } else {
              debug('Outside rate limit window, resetting count')
            }
          } else {
            debug('No existing rate limit found, creating new entry')
          }

          // Check if rate limit is exceeded
          if (count > finalConfig.maxRequests) {
            const retryAfter = Math.ceil((resetTime - now) / 1000)
            debug('Rate limit exceeded:', { count, maxRequests: finalConfig.maxRequests, retryAfter })
            return { 
              success: false, 
              retryAfter,
              remainingRequests: 0,
              resetTime
            }
          }

          debug('Updating rate limit counter:', { key, count })
          // Update the rate limit counter
          try {
            await upsertTable('rate_limits', {
              id: key,
              count,
              last_request: new Date().toISOString()
            }, {
              onConflict: 'id',
              isServer: true
            })
          } catch (error) {
            if (!isRetryableError(error)) {
              throw error
            }
          }

          debug('Rate limit updated successfully')
          return { 
            success: true, 
            retryAfter: 0,
            remainingRequests: finalConfig.maxRequests - count,
            resetTime
          }
        } catch (err) {
          const retryAfter = calculateRetryAfter(
            attempt,
            finalConfig.retryStrategy,
            finalConfig.baseRetryMs
          )

          if (attempt < (finalConfig.maxRetries || 1) && isRetryableError(err)) {
            debug(`Retry attempt ${attempt} failed, waiting ${retryAfter}ms before next attempt`)
            await new Promise(resolve => setTimeout(resolve, retryAfter))
            attempt++
            continue
          }

          errorLog('Rate limiting error:', err)
          if (finalConfig.failOnError) {
            return { 
              success: false, 
              retryAfter: 60,
              error: 'Rate limiting error',
              resetTime: Date.now() + 60000
            }
          }
          return { success: true, retryAfter: 0 }
        }
      }

      // If we've exhausted all retries
      return { 
        success: false, 
        retryAfter: 60,
        error: 'Rate limiting failed after all retry attempts',
        resetTime: Date.now() + 60000
      }
    }
  }
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  maxRequests: parseInt(process.env.AUTH_MAX_REQUESTS || '5', 10),
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60000', 10),
  keyPrefix: 'auth',
  failOnError: true,
  retryStrategy: 'exponential',
  maxRetries: 3,
  baseRetryMs: 1000
})

export const apiRateLimiter = createRateLimiter() // Uses default config

/**
 * Create a response for rate limit exceeded
 */
export function createRateLimitResponse(retryAfter: number, error?: string): Response {
  return new Response(
    JSON.stringify({
      error: error || 'Too Many Requests',
      retryAfter
    }), 
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Content-Type': 'application/json',
      },
    }
  )
} 