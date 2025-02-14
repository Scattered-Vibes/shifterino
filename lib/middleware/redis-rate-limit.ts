import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import {
  type RateLimitConfig,
  DEFAULT_CONFIG,
  generateRateLimitKey,
  createRateLimitHeaders,
  createRateLimitResponse,
  debug,
  errorLog
} from './rate-limit-core'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function rateLimit(
  request: NextRequest,
  response: NextResponse,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  try {
    debug('Creating rate limiter instance')
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
      analytics: true,
    })

    const key = generateRateLimitKey(request, config.keyPrefix)
    debug('Generated rate limit key:', key)

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(key)
    debug('Rate limit check result:', { success, limit, reset, remaining })

    // Create headers
    const headers = createRateLimitHeaders(
      limit,
      remaining,
      reset,
      Math.ceil((reset - Date.now()) / 1000)
    )

    // Add headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Return 429 if rate limit exceeded
    if (!success) {
      debug('Rate limit exceeded')
      return createRateLimitResponse(
        Math.ceil((reset - Date.now()) / 1000),
        headers
      )
    }

    debug('Rate limit check passed')
    return null
  } catch (error) {
    errorLog('Rate limit error:', error)
    if (config.failOnError) {
      return createRateLimitResponse(
        60,
        createRateLimitHeaders(0, 0, Date.now() + 60000, 60),
        'Rate limiting error'
      )
    }
    return null
  }
} 