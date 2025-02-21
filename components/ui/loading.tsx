'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  variant?: 'inline' | 'fullscreen'
  align?: 'start' | 'center' | 'end'
  size?: 'sm' | 'md' | 'lg'
}

export function Loading({ 
  message = 'Loading...',
  variant,
  align = 'center',
  size = 'md',
  className,
  ...props 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div 
      className={cn(
        'flex items-center justify-center',
        variant === 'inline' && 'inline-flex',
        variant === 'fullscreen' && 'fixed inset-0 bg-background/80',
        align === 'start' && 'items-start',
        align === 'end' && 'items-end',
        className
      )}
      {...props}
    >
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent text-primary',
          sizeClasses[size]
        )}
      >
        <span className="sr-only" role="status">{message}</span>
      </div>
    </div>
  )
}

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseBoundary({
  children,
  fallback = <Loading />,
}: SuspenseBoundaryProps) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}

// Specialized loading components with predefined styles
export function TableLoading() {
  return (
    <Loading
      className="min-h-[200px]"
      message="Loading data..."
      size="md"
      variant="inline"
    />
  )
}

export function FormLoading() {
  return (
    <Loading
      className="min-h-[100px]"
      message="Loading form..."
      size="sm"
      variant="inline"
    />
  )
}

export function ButtonLoading() {
  return (
    <Loading
      size="sm"
      message="Loading..."
      variant="inline"
      align="center"
      className="inline-flex items-center"
    />
  )
}

export function InlineLoading() {
  return (
    <Loading
      size="sm"
      variant="inline"
      align="center"
      className="inline-flex items-center"
    />
  )
}
