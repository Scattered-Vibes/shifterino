import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Default rate limit configuration
const DEFAULT_RATE_LIMIT = {
  maxRequests: 50, // Maximum requests per window
  windowMs: 60 * 1000 // 1 minute window
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  status: number
  headers: Record<string, string>
}

export async function rateLimit(
  request: NextRequest,
  response: NextResponse,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<RateLimitResult | null> {
  try {
    // Create rate limiter instance
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
      analytics: true,
    })

    // Get client IP
    const ip = request.ip ?? '127.0.0.1'

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', reset.toString())

    // Return 429 if rate limit exceeded
    if (!success) {
      return {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      }
    }

    return null
  } catch (error) {
    console.error('Rate limit error:', error)
    return null
  }
} 