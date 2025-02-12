import React from 'react'
import { render, screen } from '@testing-library/react'
import { StaffingOverview } from '@/(dashboard)/overview/components/staffing-overview'
import { describe, it, expect, vi } from 'vitest'

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      requirements: [
        {
          id: 'req-1',
          name: 'Morning Block',
          time_block_start: '05:00',
          time_block_end: '09:00',
          min_total_staff: 6,
          min_supervisors: 1,
          day_of_week: 3, // Wednesday
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      gaps: [
        {
          requirementId: 'req-1',
          totalStaffGap: 2,
          supervisorGap: 0,
          timeBlockStart: '05:00',
          timeBlockEnd: '09:00'
        }
      ]
    }
  })
}))

describe('StaffingOverview', () => {
  const mockDate = new Date('2025-01-01')

  it('renders staffing information', () => {
    render(
      <StaffingOverview 
        date={mockDate}
      />
    )

    expect(screen.getByText('05:00 - 09:00')).toBeInTheDocument()
    expect(screen.getByText(/Required: 6/i)).toBeInTheDocument()
    expect(screen.getByText(/Supervisors Required: 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Staff Gap: 2/i)).toBeInTheDocument()
  })
})