import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/api/admin/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn()
    }
  },
  from: vi.fn().mockImplementation((table) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn()
  }))
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('Admin API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin', () => {
    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = new NextRequest('http://localhost/api/admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Not authenticated')
    })

    it('should return 403 when user is not admin', async () => {
      // Mock authenticated non-admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })
      const mockProfilesQuery = mockSupabase.from('profiles')
      mockProfilesQuery.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null
      })

      const request = new NextRequest('http://localhost/api/admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden - Admin access required')
    })

    it('should return users list when authenticated as admin', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })
      const mockProfilesQuery = mockSupabase.from('profiles')
      mockProfilesQuery.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })
      mockProfilesQuery.select.mockResolvedValueOnce({
        data: [
          { id: '123', role: 'admin', users: { email: 'admin@example.com' } }
        ],
        error: null
      })

      const request = new NextRequest('http://localhost/api/admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toHaveLength(1)
      expect(data.users[0].role).toBe('admin')
    })
  })

  describe('POST /api/admin', () => {
    it('should return 400 when missing required fields', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })
      const mockProfilesQuery = mockSupabase.from('profiles')
      mockProfilesQuery.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      const request = new NextRequest('http://localhost/api/admin', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: email, role')
    })

    it('should create new user when all fields are valid', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })
      const mockProfilesQuery = mockSupabase.from('profiles')
      mockProfilesQuery.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })
      mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
        data: {
          user: { id: '456', email: 'new@example.com' }
        },
        error: null
      })
      mockProfilesQuery.insert.mockResolvedValueOnce({
        error: null
      })

      const request = new NextRequest('http://localhost/api/admin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@example.com',
          role: 'user',
          full_name: 'New User'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.email).toBe('new@example.com')
    })
  })
}) 