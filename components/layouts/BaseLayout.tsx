'use client'

import { NavigationBar } from '../navigation/NavigationBar'
import { ReactNode } from 'react'

interface BaseLayoutProps {
  children: ReactNode
  showNav?: boolean
  className?: string
}

export function BaseLayout({ 
  children, 
  showNav = true,
  className 
}: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && <NavigationBar className="sticky top-0 z-40" />}
      {children}
    </div>
  )
} 