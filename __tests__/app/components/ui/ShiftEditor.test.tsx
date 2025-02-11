import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ShiftEditor from '@/app/components/ui/ShiftEditor'
import type { Schedule } from '@/types/scheduling/schedule'

describe('ShiftEditor Component', () => {
  const mockShift: Schedule = {
    id: '1',
    employeeId: '123',
    shiftId: '456',
    date: '2025-02-01T09:00:00Z',
    status: 'pending'
  }

  const mockEmployees = [
    { id: '123', name: 'John Doe', role: 'dispatcher' },
    { id: '456', name: 'Jane Smith', role: 'dispatcher' },
    { id: '789', name: 'Bob Wilson', role: 'supervisor' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders shift details', () => {
    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Date')).toHaveValue('2025-02-01')
    expect(screen.getByLabelText('Time')).toHaveValue('09:00')
    expect(screen.getByLabelText('Employee')).toHaveValue('123')
  })

  it('handles date changes', async () => {
    const handleSave = vi.fn()

    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    )

    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '2025-02-15' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(handleSave).toHaveBeenCalledWith({
      ...mockShift,
      date: '2025-02-15T09:00:00Z'
    })
  })

  it('handles time changes', async () => {
    const handleSave = vi.fn()

    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    )

    const timeInput = screen.getByLabelText('Time')
    fireEvent.change(timeInput, { target: { value: '14:00' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(handleSave).toHaveBeenCalledWith({
      ...mockShift,
      date: '2025-02-01T14:00:00Z'
    })
  })

  it('handles employee changes', async () => {
    const handleSave = vi.fn()

    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    )

    const employeeSelect = screen.getByLabelText('Employee')
    fireEvent.change(employeeSelect, { target: { value: '456' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(handleSave).toHaveBeenCalledWith({
      ...mockShift,
      employeeId: '456'
    })
  })

  it('validates required fields', async () => {
    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    // Clear date field
    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(screen.getByText('Date is required')).toBeInTheDocument()
  })

  it('shows employee role information', () => {
    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const employeeSelect = screen.getByLabelText('Employee')
    fireEvent.change(employeeSelect, { target: { value: '789' } })

    expect(screen.getByText('Role: supervisor')).toBeInTheDocument()
  })

  it('handles cancellation', () => {
    const handleCancel = vi.fn()

    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={handleCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(handleCancel).toHaveBeenCalled()
  })

  it('shows validation error for invalid time', async () => {
    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const timeInput = screen.getByLabelText('Time')
    fireEvent.change(timeInput, { target: { value: '25:00' } })

    expect(screen.getByText('Invalid time format')).toBeInTheDocument()
  })

  it('disables save button when form is invalid', () => {
    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('shows loading state during save', async () => {
    const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <ShiftEditor
        shift={mockShift}
        employees={mockEmployees}
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })
}) 