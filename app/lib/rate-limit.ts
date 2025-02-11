import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Rate limit configuration types
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  limitExceeded: boolean
  retryAfter: number
}

// Default configurations for different endpoints
const configs: Record<string, RateLimitConfig> = {
  auth: {
    maxRequests: parseInt(process.env.AUTH_MAX_REQUESTS || '10', 10),
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  },
  api: {
    maxRequests: parseInt(process.env.API_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  },
}

/**
 * Generate a unique key for rate limiting based on IP and path
 */
function generateRateLimitKey(request: NextRequest): string {
  const ip = request.ip || 'anonymous'
  const path = request.nextUrl.pathname
  return `rate_limit:${ip}:${path}`
}

/**
 * Check and update rate limit for a request
 */
export async function rateLimitRequest(request: NextRequest): Promise<RateLimitResult> {
  const path = request.nextUrl.pathname
  const key = generateRateLimitKey(request)
  const supabase = createClient()

  // Determine the correct config based on the path
  const configKey = path.startsWith('/api/auth') ? 'auth' : 'api'
  const config = configs[configKey]

  try {
    // Check current rate limit status
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('count, last_request')
      .eq('id', key)
      .single()

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError)
      // On error, let the request through but log the error
      return { limitExceeded: false, retryAfter: 0 }
    }

    const now = Date.now()
    let count = 1
    const resetTime = now + config.windowMs

    if (rateLimitData) {
      const lastRequest = new Date(rateLimitData.last_request).getTime()
      if (now - lastRequest < config.windowMs) {
        count = rateLimitData.count + 1
      }
    }

    // Check if rate limit is exceeded
    if (count > config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - now) / 1000)
      return { limitExceeded: true, retryAfter }
    }

    // Update the rate limit counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .upsert(
        {
          id: key,
          count: count,
          last_request: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (updateError) {
      console.error('Rate limit update error:', updateError)
      // On error, let the request through but log the error
      return { limitExceeded: false, retryAfter: 0 }
    }

    return { limitExceeded: false, retryAfter: 0 }
  } catch (error) {
    console.error('Unexpected error in rate limiting:', error)
    // On unexpected error, let the request through but log the error
    return { limitExceeded: false, retryAfter: 0 }
  }
}

/**
 * Create a response for rate limit exceeded
 */
export function createRateLimitResponse(retryAfter: number): Response {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'Content-Type': 'text/plain',
    },
  })
} 