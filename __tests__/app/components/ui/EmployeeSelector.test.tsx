import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EmployeeSelector from '@/app/components/ui/EmployeeSelector'

interface Employee {
  id: string
  name: string
  role: string
  availability?: {
    start: string
    end: string
  }[]
}

describe('EmployeeSelector Component', () => {
  const mockEmployees: Employee[] = [
    {
      id: '123',
      name: 'John Doe',
      role: 'dispatcher',
      availability: [
        { start: '09:00', end: '17:00' }
      ]
    },
    {
      id: '456',
      name: 'Jane Smith',
      role: 'dispatcher',
      availability: [
        { start: '14:00', end: '22:00' }
      ]
    },
    {
      id: '789',
      name: 'Bob Wilson',
      role: 'supervisor',
      availability: [
        { start: '08:00', end: '16:00' }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders employee list', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
  })

  it('filters by role', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        filterByRole
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
  })

  it('handles employee selection', () => {
    const handleSelect = vi.fn()

    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={handleSelect}
        requiredRole="dispatcher"
      />
    )

    const employeeCard = screen.getByTestId('employee-123')
    fireEvent.click(employeeCard)

    expect(handleSelect).toHaveBeenCalledWith('123')
  })

  it('shows selected state', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId="123"
        onSelect={vi.fn()}
        requiredRole="dispatcher"
      />
    )

    const selectedCard = screen.getByTestId('employee-123')
    expect(selectedCard).toHaveClass('selected')
  })

  it('displays availability information', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        showAvailability
      />
    )

    expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument()
  })

  it('handles search filtering', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        enableSearch
      />
    )

    const searchInput = screen.getByPlaceholderText('Search employees...')
    fireEvent.change(searchInput, { target: { value: 'Jane' } })

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('shows loading state', async () => {
    render(
      <EmployeeSelector
        employees={[]}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        isLoading
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles no results state', () => {
    render(
      <EmployeeSelector
        employees={[]}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
      />
    )

    expect(screen.getByText('No employees found')).toBeInTheDocument()
  })

  it('shows role badges', () => {
    render(
      <EmployeeSelector
        employees={mockEmployees}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        showRoleBadges
      />
    )

    expect(screen.getAllByTestId('role-badge')).toHaveLength(3)
    expect(screen.getByText('supervisor')).toHaveClass('role-badge')
  })

  it('disables unavailable employees', () => {
    const employeesWithUnavailable = [
      ...mockEmployees,
      {
        id: '101',
        name: 'Alice Brown',
        role: 'dispatcher',
        availability: [] // No availability
      }
    ]

    render(
      <EmployeeSelector
        employees={employeesWithUnavailable}
        selectedId={null}
        onSelect={vi.fn()}
        requiredRole="dispatcher"
        checkAvailability
      />
    )

    const unavailableCard = screen.getByTestId('employee-101')
    expect(unavailableCard).toHaveClass('unavailable')
    expect(unavailableCard).toHaveAttribute('aria-disabled', 'true')
  })
}) 