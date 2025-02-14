import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
  failOnError?: boolean
  retryStrategy?: 'exponential' | 'linear' | 'fixed'
  maxRetries?: number
  baseRetryMs?: number
}

export interface RateLimitResult {
  success: boolean
  retryAfter: number
  remainingRequests?: number
  resetTime?: number
  error?: string
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string
  'X-RateLimit-Remaining': string
  'X-RateLimit-Reset': string
  'Retry-After'?: string
}

export const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: parseInt(process.env.API_MAX_REQUESTS || '100', 10),
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  keyPrefix: 'api',
  failOnError: true,
  retryStrategy: 'exponential',
  maxRetries: 3,
  baseRetryMs: 1000
}

export function calculateRetryAfter(
  attempt: number,
  strategy: RateLimitConfig['retryStrategy'] = 'exponential',
  baseMs: number = 1000
): number {
  switch (strategy) {
    case 'exponential':
      return Math.min(baseMs * Math.pow(2, attempt - 1), 60000)
    case 'linear':
      return Math.min(baseMs * attempt, 60000)
    case 'fixed':
    default:
      return baseMs
  }
}

export function generateRateLimitKey(request: NextRequest, prefix: string = 'api'): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             request.headers.get('x-client-ip') || 
             'anonymous'
             
  const path = request.nextUrl.pathname
  return `rate_limit:${prefix}:${ip}:${path}`
}

export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number,
  retryAfter?: number
): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  }

  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString()
  }

  return headers
}

export function createRateLimitResponse(
  retryAfter: number,
  headers: RateLimitHeaders,
  error?: string
): Response {
  return new Response(
    JSON.stringify({
      error: error || 'Too Many Requests',
      retryAfter,
      nextAttemptAt: new Date(Date.now() + retryAfter * 1000).toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}

// Enhanced debug logging with timestamps
export const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[RATE_LIMIT][${new Date().toISOString()}]`, ...args)
  }
}

export const errorLog = (...args: unknown[]) => {
  console.error(`[RATE_LIMIT_ERROR][${new Date().toISOString()}]`, ...args)
}

// Helper to determine if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Add specific error types that should be retried
    return error.message.includes('timeout') || 
           error.message.includes('connection') ||
           error.message.includes('network')
  }
  return false
}

// Helper to validate rate limit config
export function validateConfig(config: Partial<RateLimitConfig>): RateLimitConfig {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  if (finalConfig.maxRequests <= 0) {
    throw new Error('maxRequests must be greater than 0')
  }
  
  if (finalConfig.windowMs <= 0) {
    throw new Error('windowMs must be greater than 0')
  }
  
  if (finalConfig.maxRetries && finalConfig.maxRetries <= 0) {
    throw new Error('maxRetries must be greater than 0')
  }
  
  if (finalConfig.baseRetryMs && finalConfig.baseRetryMs <= 0) {
    throw new Error('baseRetryMs must be greater than 0')
  }
  
  return finalConfig
} 