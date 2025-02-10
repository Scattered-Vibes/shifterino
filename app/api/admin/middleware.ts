import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/middleware/rate-limit'

// Stricter rate limiting for admin routes
const ADMIN_RATE_LIMIT = {
  maxRequests: 20, // Maximum requests per window
  windowMs: 60 * 1000 // 1 minute window
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, response, ADMIN_RATE_LIMIT)
  if (rateLimitResult) {
    return new NextResponse(null, {
      status: rateLimitResult.status,
      headers: rateLimitResult.headers
    })
  }

  return response
}

export const config = {
  matcher: '/api/admin/:path*'
} 