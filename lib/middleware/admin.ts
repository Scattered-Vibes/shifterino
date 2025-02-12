import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from './supabase-rate-limit'

// Stricter rate limiting for admin routes
const ADMIN_RATE_LIMIT = {
  maxRequests: 20, // Maximum requests per window
  windowMs: 60 * 1000, // 1 minute window
  keyPrefix: 'admin_route'
}

// Create rate limiter instance
const rateLimiter = createRateLimiter(ADMIN_RATE_LIMIT)

export async function adminMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      )
    }

    return response
  } catch (error) {
    console.error('Admin middleware error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const config = {
  matcher: '/api/admin/:path*'
} 