'use client'

import { Header } from '@/components/ui/header'

interface ClientLayoutProps {
  children: React.ReactNode
  user: {
    email: string
    role: string
  }
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
