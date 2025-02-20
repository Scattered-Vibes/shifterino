'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function Loading({ 
  size = 'md', 
  fullScreen = false,
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
        fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm',
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
        <span className="sr-only">Loading...</span>
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
      text="Loading data..."
      size="md"
    />
  )
}

export function FormLoading() {
  return (
    <Loading
      className="min-h-[100px]"
      text="Loading form..."
      size="sm"
    />
  )
}

export function ButtonLoading() {
  return (
    <Loading
      size="sm"
      text={null}
      centered={false}
      className="inline-flex items-center"
    />
  )
}

export function InlineLoading() {
  return (
    <Loading
      size="sm"
      text={null}
      centered={false}
      className="inline-flex items-center"
    />
  )
}
