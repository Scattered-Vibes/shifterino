import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StaffingOverview } from '@/components/StaffingOverview'
import { type TimeBlock } from '@/types/schedule'

// Mock the utils functions
vi.mock('@/lib/utils', () => ({
  formatTime: (time: string) => time,
  formatDate: () => 'January 1, 2025',
  cn: (...inputs: (string | boolean | undefined)[]) => inputs.filter(Boolean).join(' ')
}))

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
    },
    {
      id: 'block2',
      startTime: '09:00',
      endTime: '21:00',
      minStaff: 8,
      currentStaff: 6,
      supervisors: 1,
      date: '2025-01-01'
    }
  ]

  it('renders time blocks with staffing information', () => {
    const { container } = render(
      <StaffingOverview 
        date={mockDate} 
        timeBlocks={mockTimeBlocks} 
      />
    )

    // Get all time block cards
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards).toHaveLength(2)

    // Check first time block
    const firstCard = cards[0] as HTMLElement
    expect(within(firstCard).getByText('05:00 - 09:00')).toBeInTheDocument()
    expect(within(firstCard).getByText('Required: 6')).toBeInTheDocument()
    expect(within(firstCard).getByText('Current: 4')).toBeInTheDocument()
    expect(within(firstCard).getByText('Supervisors: 1')).toBeInTheDocument()
    expect(within(firstCard).getByText('Understaffed by 2')).toBeInTheDocument()

    // Check second time block
    const secondCard = cards[1] as HTMLElement
    expect(within(secondCard).getByText('09:00 - 21:00')).toBeInTheDocument()
    expect(within(secondCard).getByText('Required: 8')).toBeInTheDocument()
    expect(within(secondCard).getByText('Current: 6')).toBeInTheDocument()
    expect(within(secondCard).getByText('Supervisors: 1')).toBeInTheDocument()
    expect(within(secondCard).getByText('Understaffed by 2')).toBeInTheDocument()
  })

  it('handles empty time blocks', () => {
    render(
      <StaffingOverview 
        date={mockDate} 
        timeBlocks={[]} 
      />
    )
    
    expect(screen.queryByText(/Required:/)).not.toBeInTheDocument()
  })

  it('shows understaffed warning when current staff is below minimum', () => {
    const understaffedBlocks: TimeBlock[] = [
      {
        id: 'block3',
        startTime: '21:00',
        endTime: '05:00',
        minStaff: 6,
        currentStaff: 3,
        supervisors: 1,
        date: '2025-01-01'
      }
    ]

    render(
      <StaffingOverview 
        date={mockDate} 
        timeBlocks={understaffedBlocks} 
      />
    )

    expect(screen.getByText('21:00 - 05:00')).toBeInTheDocument()
    expect(screen.getByText('Required: 6')).toBeInTheDocument()
    expect(screen.getByText('Current: 3')).toBeInTheDocument()
    expect(screen.getByText('Supervisors: 1')).toBeInTheDocument()
    expect(screen.getByText('Understaffed by 3')).toBeInTheDocument()
  })

  it('displays the correct date format', () => {
    render(
      <StaffingOverview 
        date={mockDate} 
        timeBlocks={mockTimeBlocks} 
      />
    )

    expect(screen.getByText('January 1, 2025')).toBeInTheDocument()
  })
}) 