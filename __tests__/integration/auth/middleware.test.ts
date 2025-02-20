import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { setupAuthMocks } from '../../helpers/auth'

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access to public routes when unauthenticated', async () => {
    setupAuthMocks({ authenticated: false })
    const request = new NextRequest(new URL('http://localhost:3000/login'))
    const response = await middleware(request)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    setupAuthMocks({ authenticated: false })
    const request = new NextRequest(new URL('http://localhost:3000/overview'))
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirectTo=/overview')
  })

  it('redirects authenticated users from public routes to overview', async () => {
    setupAuthMocks({ authenticated: true })
    const request = new NextRequest(new URL('http://localhost:3000/login'))
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/overview')
  })

  it('allows authenticated users to access protected routes', async () => {
    setupAuthMocks({ authenticated: true })
    const request = new NextRequest(new URL('http://localhost:3000/overview'))
    const response = await middleware(request)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })

  it('preserves query parameters in redirectTo', async () => {
    setupAuthMocks({ authenticated: false })
    const request = new NextRequest(
      new URL('http://localhost:3000/overview?tab=settings&view=profile')
    )
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?redirectTo=/overview?tab=settings&view=profile'
    )
  })

  it('skips middleware for API routes', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/auth/callback'))
    const response = await middleware(request)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })

  it('skips middleware for static files', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/favicon.ico'))
    const response = await middleware(request)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })

  it('handles auth errors gracefully', async () => {
    setupAuthMocks({ 
      authenticated: false, 
      error: { message: 'Auth service unavailable', status: 503 }
    })
    const request = new NextRequest(new URL('http://localhost:3000/overview'))
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirectTo=/overview')
  })

  it('preserves cookies in the response', async () => {
    setupAuthMocks({ authenticated: true })
    const request = new NextRequest(new URL('http://localhost:3000/overview'))
    const cookieValue = 'some-value'
    request.cookies.set('some-cookie', cookieValue)
    
    const response = await middleware(request)
    
    const cookie = response.cookies.get('some-cookie')
    expect(cookie?.value).toBe(cookieValue)
  })

  it('handles non-GET requests correctly', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/data'), {
      method: 'POST'
    })
    const response = await middleware(request)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })
}) 