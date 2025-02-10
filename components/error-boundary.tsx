'use client'

import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  FallbackComponent: ComponentType<{ error: Error }>
  onErrorCapture?: (error: Error) => void
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    if (this.props.onErrorCapture) {
      this.props.onErrorCapture(error)
    }
  }

  public render() {
    if (this.state.error !== null) {
      return <this.props.FallbackComponent error={this.state.error} />
    }

    return this.props.children
  }
}

interface ErrorBoundaryWrapperProps {
  children: ReactNode
  onErrorCapture?: (error: Error) => void
  className?: string
  FallbackComponent: ComponentType<{ error: Error }>
}

export function ErrorBoundaryWrapper({
  children,
  onErrorCapture,
  className = '',
  FallbackComponent
}: ErrorBoundaryWrapperProps) {
  return (
    <div className={className}>
      <ErrorBoundary 
        onErrorCapture={onErrorCapture} 
        FallbackComponent={FallbackComponent}
      >
        {children}
      </ErrorBoundary>
    </div>
  )
}
