import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Rate limit configuration types
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
  failOnError?: boolean
}

export interface RateLimitResult {
  success: boolean
  retryAfter: number
  error?: string
}

// Default configurations
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: parseInt(process.env.API_MAX_REQUESTS || '100', 10),
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  keyPrefix: 'api',
  failOnError: true // Default to failing closed on errors
}

const debug = (...args: unknown[]) => {
  console.log('[RATE_LIMIT]', ...args)
}

const errorLog = (...args: unknown[]) => {
  console.error('[RATE_LIMIT_ERROR]', ...args)
}

/**
 * Generate a unique key for rate limiting based on IP and path
 */
function generateRateLimitKey(request: NextRequest, prefix: string = 'api'): string {
  // Try different headers for IP address
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             request.headers.get('x-client-ip') || 
             'anonymous'
             
  const path = request.nextUrl.pathname
  const key = `rate_limit:${prefix}:${ip}:${path}`
  debug('Generated key:', key)
  return key
}

export interface RateLimiter {
  check: (request: NextRequest) => Promise<RateLimitResult>
}

/**
 * Create a rate limiter instance with custom configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}): RateLimiter {
  const finalConfig: RateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config
  }

  return {
    check: async (request: NextRequest): Promise<RateLimitResult> => {
      const key = generateRateLimitKey(request, finalConfig.keyPrefix)
      debug('Creating service client')
      const supabase = createServiceClient() as SupabaseClient<Database>

      try {
        debug('Checking rate limit for key:', key)
        // Check current rate limit status
        const { data: rateLimitData, error: rateLimitError } = await supabase
          .from('rate_limits')
          .select('count, last_request')
          .eq('id', key)

        if (rateLimitError) {
          errorLog('Rate limit check error:', rateLimitError)
          // If configured to fail on errors, deny the request
          if (finalConfig.failOnError) {
            return { 
              success: false, 
              retryAfter: 60, // Default to 1 minute retry on errors
              error: 'Rate limit check failed'
            }
          }
          // Otherwise, let it through but log the error
          return { success: true, retryAfter: 0, error: 'Rate limit check error' }
        }

        const now = Date.now()
        let count = 1
        const resetTime = now + finalConfig.windowMs

        // Get the most recent rate limit entry if it exists
        const latestEntry = rateLimitData?.[0]
        if (latestEntry) {
          debug('Found existing rate limit data:', latestEntry)
          const lastRequest = new Date(latestEntry.last_request).getTime()
          if (now - lastRequest < finalConfig.windowMs) {
            count = latestEntry.count + 1
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
          return { success: false, retryAfter }
        }

        debug('Updating rate limit counter:', { key, count })
        // Update the rate limit counter
        const { error: updateError } = await supabase
          .from('rate_limits')
          .upsert(
            {
              id: key,
              count,
              last_request: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )

        if (updateError) {
          errorLog('Rate limit update error:', updateError)
          // If configured to fail on errors, deny the request
          if (finalConfig.failOnError) {
            return { 
              success: false, 
              retryAfter: 60,
              error: 'Rate limit update failed'
            }
          }
          // Otherwise, let it through but log the error
          return { success: true, retryAfter: 0, error: 'Rate limit update error' }
        }

        debug('Rate limit updated successfully')
        return { success: true, retryAfter: 0 }
      } catch (err) {
        errorLog('Unexpected error in rate limiting:', err)
        // If configured to fail on errors, deny the request
        if (finalConfig.failOnError) {
          return { 
            success: false, 
            retryAfter: 60,
            error: 'Unexpected rate limit error'
          }
        }
        // Otherwise, let it through but log the error
        return { success: true, retryAfter: 0, error: 'Unexpected rate limit error' }
      }
    }
  }
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  maxRequests: parseInt(process.env.AUTH_MAX_REQUESTS || '5', 10),
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60000', 10),
  keyPrefix: 'auth',
  failOnError: true
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