import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createMockServerComponentClient } from '../../../test/supabase-mock'
import ScheduleManager from '@/app/components/schedule/ScheduleManager'
import type { Schedule, ScheduleGenerationOptions } from '@/types/scheduling/schedule'

describe('End-to-End Scheduling Flow', () => {
  const mockOptions: ScheduleGenerationOptions = {
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-02-28T23:59:59Z',
    constraints: {
      maxHoursPerWeek: 40,
      minRestHours: 8,
      preferredShiftPatterns: true,
      balanceWorkload: true
    }
  }

  const mockSchedule: Schedule[] = [
    {
      id: '1',
      employeeId: '123',
      shiftId: '456',
      date: '2025-02-01T09:00:00Z',
      status: 'pending'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full scheduling workflow', async () => {
    const supabase = createMockServerComponentClient()

    // Mock API responses
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({
        data: [{ id: '123', name: 'John Doe', role: 'dispatcher' }],
        error: null
      })
    }).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({
        data: [{ id: '456', startTime: '09:00', endTime: '17:00' }],
        error: null
      })
    })

    render(<ScheduleManager supabase={supabase} />)

    // Step 1: Configure schedule options
    const startDateInput = screen.getByLabelText('Start Date')
    const endDateInput = screen.getByLabelText('End Date')
    const generateButton = screen.getByRole('button', { name: /generate schedule/i })

    fireEvent.change(startDateInput, { target: { value: '2025-02-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-02-28' } })
    fireEvent.click(generateButton)

    // Wait for schedule generation
    await waitFor(() => {
      expect(screen.getByTestId('schedule-grid')).toBeInTheDocument()
    })

    // Step 2: Review generated schedule
    const scheduleItems = screen.getAllByTestId('schedule-item')
    expect(scheduleItems).toHaveLength(mockSchedule.length)

    // Step 3: Make manual adjustments
    const firstShift = screen.getByTestId('schedule-item-1')
    fireEvent.click(firstShift)

    const reassignButton = screen.getByRole('button', { name: /reassign/i })
    fireEvent.click(reassignButton)

    const employeeSelect = screen.getByLabelText('Select Employee')
    fireEvent.change(employeeSelect, { target: { value: '456' } })

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByText('Schedule updated')).toBeInTheDocument()
    })

    // Step 4: Validate changes
    const updatedShift = screen.getByTestId('schedule-item-1')
    expect(updatedShift).toHaveTextContent('Jane Smith') // New employee

    // Step 5: Publish schedule
    const publishButton = screen.getByRole('button', { name: /publish/i })
    fireEvent.click(publishButton)

    // Wait for publish confirmation
    await waitFor(() => {
      expect(screen.getByText('Schedule published')).toBeInTheDocument()
    })

    // Verify final state
    expect(screen.getByTestId('schedule-status')).toHaveTextContent('Published')
  })

  it('handles validation errors', async () => {
    const supabase = createMockServerComponentClient()

    // Mock API error response
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Validation failed' }
      })
    })

    render(<ScheduleManager supabase={supabase} />)

    const generateButton = screen.getByRole('button', { name: /generate schedule/i })
    fireEvent.click(generateButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument()
    })

    // Verify error state
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(generateButton).not.toBeDisabled() // Can retry
  })

  it('handles conflict resolution', async () => {
    const supabase = createMockServerComponentClient()

    // Mock initial load
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({
        data: mockSchedule,
        error: null
      })
    })

    render(<ScheduleManager supabase={supabase} />)

    // Create a conflict
    const conflictingShift = screen.getByTestId('schedule-item-1')
    fireEvent.click(conflictingShift)

    const timeInput = screen.getByLabelText('Shift Time')
    fireEvent.change(timeInput, { target: { value: '08:00' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    // Wait for conflict warning
    await waitFor(() => {
      expect(screen.getByText(/schedule conflict detected/i)).toBeInTheDocument()
    })

    // Resolve conflict
    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i })
    fireEvent.click(resolveButton)

    // Wait for resolution
    await waitFor(() => {
      expect(screen.getByText('Conflict resolved')).toBeInTheDocument()
    })

    // Verify resolved state
    expect(screen.queryByText(/schedule conflict detected/i)).not.toBeInTheDocument()
  })
}) 