import React from 'react'
import { render, screen } from '@testing-library/react'
import { StaffingOverview } from '@/components/StaffingOverview'
import { type TimeBlock } from '@/types/schedule'

describe('StaffingOverview', () => {
  const mockDate = new Date('2025-01-01')
  
  const mockTimeBlocks: TimeBlock[] = [
    {
      id: 'block1',
      startTime: '05:00',
      endTime: '09:00',
      minStaff: 6,
      currentStaff: 4,
      supervisors: 1,
      date: '2025-01-01'
    }
  ]

  it('renders staffing information', () => {
    render(
      <StaffingOverview 
        date={mockDate}
        timeBlocks={mockTimeBlocks}
      />
    )

    expect(screen.getByText('05:00 - 09:00')).toBeInTheDocument()
    expect(screen.getByText('Required: 6')).toBeInTheDocument()
    expect(screen.getByText('Current: 4')).toBeInTheDocument()
    expect(screen.getByText('Supervisors: 1')).toBeInTheDocument()
    expect(screen.getByText('Understaffed by 2')).toBeInTheDocument()
  })
}) 