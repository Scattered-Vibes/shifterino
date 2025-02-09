'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string | null
  className?: string
  centered?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function Loading({
  size = 'md',
  text = 'Loading...',
  className,
  centered = true,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        centered && 'items-center justify-center',
        className
      )}
      {...props}
      role="status"
      aria-label={text || 'Loading'}
    >
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
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
