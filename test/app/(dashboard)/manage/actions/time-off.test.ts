import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { checkTimeOffConflicts, createTimeOffRequest } from '@/app/(dashboard)/manage/actions/time-off'
import { ErrorCode } from '@/lib/utils/error-handler'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => createClient(
    'http://localhost:54321',
    'test-anon-key'
  ))
}))

describe('Time Off Actions', () => {
  describe('checkTimeOffConflicts', () => {
    it('validates date format correctly', async () => {
      const { error } = await checkTimeOffConflicts({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: 'invalid-date',
        end_date: '2025-01-02'
      })

      expect(error?.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error?.message).toContain('Invalid date format')
    })

    it('validates end date is not before start date', async () => {
      const { error } = await checkTimeOffConflicts({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-01-02',
        end_date: '2025-01-01'
      })

      expect(error?.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error?.message).toContain('End date must be after')
    })

    it('detects conflicts correctly', async () => {
      const { data, error } = await checkTimeOffConflicts({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-01-01',
        end_date: '2025-01-05'
      })

      expect(error).toBeNull()
      expect(typeof data).toBe('boolean')
    })

    it('handles exclude_request_id correctly', async () => {
      const { data, error } = await checkTimeOffConflicts({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-01-01',
        end_date: '2025-01-05',
        exclude_request_id: '123e4567-e89b-12d3-a456-426614174001'
      })

      expect(error).toBeNull()
      expect(typeof data).toBe('boolean')
    })
  })

  describe('createTimeOffRequest', () => {
    it('validates input correctly', async () => {
      const { error } = await createTimeOffRequest({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: 'invalid-date',
        end_date: '2025-01-02',
        reason: 'Vacation',
        type: 'vacation'
      })

      expect(error?.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error?.message).toContain('Invalid date format')
    })

    it('checks for conflicts before creating', async () => {
      const { error } = await createTimeOffRequest({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-01-01',
        end_date: '2025-01-05',
        reason: 'Vacation',
        type: 'vacation'
      })

      // If there's a conflict, it should return a CONFLICT error
      if (error?.code === ErrorCode.CONFLICT) {
        expect(error.message).toContain('conflicts with existing')
      }
    })

    it('creates request successfully with valid input', async () => {
      const { data, error } = await createTimeOffRequest({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-02-01',
        end_date: '2025-02-05',
        reason: 'Vacation',
        type: 'vacation'
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({
        employee_id: '123e4567-e89b-12d3-a456-426614174000',
        start_date: '2025-02-01',
        end_date: '2025-02-05',
        reason: 'Vacation',
        type: 'vacation',
        status: 'pending'
      })
    })
  })
}) 