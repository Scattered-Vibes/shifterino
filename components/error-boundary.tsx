'use client'

import { Component, type ReactNode } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  onErrorCapture?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error) {
    if (this.props.onErrorCapture) {
      this.props.onErrorCapture(error)
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Alert variant="destructive" className="w-full max-w-2xl">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 rounded-md bg-slate-950 p-4 text-sm text-white">
                  <code>{this.state.error?.message}</code>
                </pre>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

interface ErrorBoundaryWrapperProps extends Props {
  className?: string
}

export function ErrorBoundaryWrapper({
  children,
  onErrorCapture,
  className = '',
}: ErrorBoundaryWrapperProps) {
  return (
    <div className={className}>
      <ErrorBoundary onErrorCapture={onErrorCapture}>{children}</ErrorBoundary>
    </div>
  )
}
