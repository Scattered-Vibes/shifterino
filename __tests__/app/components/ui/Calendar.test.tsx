import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Calendar from '@/app/components/ui/Calendar'
import type { Schedule } from '@/types/scheduling/schedule'

describe('Calendar Component', () => {
  const mockSchedule: Schedule[] = [
    {
      id: '1',
      employeeId: '123',
      shiftId: '456',
      date: '2025-02-01T09:00:00Z',
      status: 'pending'
    },
    {
      id: '2',
      employeeId: '456',
      shiftId: '789',
      date: '2025-02-01T17:00:00Z',
      status: 'approved'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders calendar grid', () => {
    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    // Check calendar structure
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(35) // 5 weeks x 7 days
  })

  it('displays shifts in correct time slots', () => {
    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    // Check shift placement
    const dayShift = screen.getByTestId('shift-1')
    const eveningShift = screen.getByTestId('shift-2')

    expect(dayShift).toHaveTextContent('9:00 AM')
    expect(eveningShift).toHaveTextContent('5:00 PM')
  })

  it('handles shift click events', () => {
    const handleShiftClick = vi.fn()

    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={handleShiftClick}
        onDateSelect={vi.fn()}
      />
    )

    // Click a shift
    const shift = screen.getByTestId('shift-1')
    fireEvent.click(shift)

    expect(handleShiftClick).toHaveBeenCalledWith(mockSchedule[0])
  })

  it('handles date selection', () => {
    const handleDateSelect = vi.fn()

    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={handleDateSelect}
      />
    )

    // Click a date cell
    const dateCell = screen.getAllByRole('gridcell')[0]
    fireEvent.click(dateCell)

    expect(handleDateSelect).toHaveBeenCalledWith(expect.any(Date))
  })

  it('shows shift status indicators', () => {
    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    const pendingShift = screen.getByTestId('shift-1')
    const approvedShift = screen.getByTestId('shift-2')

    expect(pendingShift).toHaveClass('status-pending')
    expect(approvedShift).toHaveClass('status-approved')
  })

  it('handles month navigation', () => {
    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    const prevButton = screen.getByRole('button', { name: /previous month/i })
    const nextButton = screen.getByRole('button', { name: /next month/i })

    // Navigate to previous month
    fireEvent.click(prevButton)
    expect(screen.getByText('January 2025')).toBeInTheDocument()

    // Navigate to next month
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    expect(screen.getByText('March 2025')).toBeInTheDocument()
  })

  it('highlights current day', () => {
    // Mock current date
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-02-01'))

    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    const today = screen.getByTestId('calendar-cell-2025-02-01')
    expect(today).toHaveClass('current-day')

    vi.useRealTimers()
  })

  it('handles week view toggle', () => {
    render(
      <Calendar
        schedule={mockSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    const weekViewButton = screen.getByRole('button', { name: /week view/i })
    fireEvent.click(weekViewButton)

    // Check week view
    expect(screen.getAllByRole('gridcell')).toHaveLength(7) // 7 days
    expect(screen.getByTestId('calendar-view-type')).toHaveTextContent('Week')
  })

  it('shows shift conflicts', () => {
    const conflictingSchedule: Schedule[] = [
      ...mockSchedule,
      {
        id: '3',
        employeeId: '123', // Same employee as shift 1
        shiftId: '101',
        date: '2025-02-01T10:00:00Z', // Overlaps with shift 1
        status: 'pending'
      }
    ]

    render(
      <Calendar
        schedule={conflictingSchedule}
        onShiftClick={vi.fn()}
        onDateSelect={vi.fn()}
      />
    )

    const conflictingShift = screen.getByTestId('shift-3')
    expect(conflictingShift).toHaveClass('conflict')
  })
}) 