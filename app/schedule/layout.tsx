import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule Management',
  description: 'Manage employee schedules, time off, shift swaps, and on-call rotations.',
}

interface ScheduleLayoutProps {
  children: React.ReactNode
}

export default function ScheduleLayout({ children }: ScheduleLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      {children}
    </main>
  )
} 