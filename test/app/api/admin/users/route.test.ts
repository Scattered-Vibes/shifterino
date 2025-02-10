import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/admin/users/route'
import { mockAuthUser, mockUnauthenticated } from '@/test/helpers/auth'

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/users', () => {
    it('should list users when authenticated as manager', async () => {
      // Mock manager user
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin = {
        listUsers: vi.fn().mockResolvedValue({
          data: [{ id: 'user-1' }, { id: 'user-2' }],
          error: null
        })
      }
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users')

      // Call route handler
      const response = await GET(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)

      // Verify Supabase calls
      expect(supabase.auth.admin.listUsers).toHaveBeenCalled()
    })

    it('should reject non-manager users', async () => {
      // Mock dispatcher user
      mockAuthUser('dispatcher')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users')

      // Call route handler
      const response = await GET(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Manager role required'
      })
    })

    it('should reject unauthenticated requests', async () => {
      // Mock unauthenticated state
      mockUnauthenticated()
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users')

      // Call route handler
      const response = await GET(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized'
      })
    })

    it('should handle Supabase errors gracefully', async () => {
      // Mock manager with Supabase error
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin = {
        listUsers: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', status: 500 }
        })
      }
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users')

      // Call route handler
      const response = await GET(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/admin/users', () => {
    it('should delete user when authenticated as manager', async () => {
      // Mock manager user
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin = {
        deleteUser: vi.fn().mockResolvedValue({
          error: null
        })
      }
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user-to-delete' })
      })

      // Call route handler
      const response = await DELETE(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true
      })

      // Verify Supabase calls
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-to-delete')
    })

    it('should reject non-manager users', async () => {
      // Mock supervisor user
      mockAuthUser('supervisor')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user-to-delete' })
      })

      // Call route handler
      const response = await DELETE(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Manager role required'
      })
    })

    it('should reject requests without userId', async () => {
      // Mock manager user
      mockAuthUser('manager')
      
      // Create request without userId
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({})
      })

      // Call route handler
      const response = await DELETE(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'User ID is required'
      })
    })

    it('should handle Supabase delete errors', async () => {
      // Mock manager with Supabase error
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin = {
        deleteUser: vi.fn().mockResolvedValue({
          error: { message: 'Failed to delete user', status: 400 }
        })
      }
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user-to-delete' })
      })

      // Call route handler
      const response = await DELETE(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
}) 