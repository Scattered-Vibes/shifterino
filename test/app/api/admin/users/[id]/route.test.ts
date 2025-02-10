import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/admin/users/[id]/route'
import { mockAuthUser, mockUnauthenticated } from '@/test/helpers/auth'

describe('Admin User By ID API', () => {
  const params = { id: 'test-user-id' }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/users/[id]', () => {
    it('should get user by ID when authenticated as manager', async () => {
      // Mock manager user
      const { supabase, user } = mockAuthUser('manager')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id')

      // Call route handler
      const response = await GET(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.data).toEqual(user)

      // Verify Supabase calls
      expect(supabase.auth.admin.getUserById).toHaveBeenCalledWith(params.id)
    })

    it('should reject non-manager users', async () => {
      // Mock dispatcher user
      mockAuthUser('dispatcher')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id')

      // Call route handler
      const response = await GET(request, { params })
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
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id')

      // Call route handler
      const response = await GET(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized'
      })
    })

    it('should handle user not found', async () => {
      // Mock manager with user not found
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/non-existent')

      // Call route handler
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(404)
      expect(data).toEqual({
        error: 'User not found'
      })
    })

    it('should handle Supabase errors gracefully', async () => {
      // Mock manager with Supabase error
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', status: 500 }
      })
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id')

      // Call route handler
      const response = await GET(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/admin/users/[id]', () => {
    it('should delete user when authenticated as manager', async () => {
      // Mock manager user
      const { supabase } = mockAuthUser('manager')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id', {
        method: 'DELETE'
      })

      // Call route handler
      const response = await DELETE(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true
      })

      // Verify Supabase calls
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith(params.id)
    })

    it('should reject non-manager users', async () => {
      // Mock supervisor user
      mockAuthUser('supervisor')
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id', {
        method: 'DELETE'
      })

      // Call route handler
      const response = await DELETE(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Manager role required'
      })
    })

    it('should handle Supabase delete errors', async () => {
      // Mock manager with Supabase error
      const { supabase } = mockAuthUser('manager')
      supabase.auth.admin.deleteUser.mockResolvedValueOnce({
        error: { message: 'Failed to delete user', status: 400 }
      })
      
      // Create request
      const request = new NextRequest('http://localhost/api/admin/users/test-user-id', {
        method: 'DELETE'
      })

      // Call route handler
      const response = await DELETE(request, { params })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
}) 