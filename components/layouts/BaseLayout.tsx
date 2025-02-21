'use client'

import { NavigationBar } from '../navigation/NavigationBar'
import { ReactNode } from 'react'

interface BaseLayoutProps {
  children: ReactNode
  showNav?: boolean
}

export function BaseLayout({ children, showNav = true }: BaseLayoutProps) {
  return (
    <div className="min-h-screen">
      {showNav && <NavigationBar />}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
} 