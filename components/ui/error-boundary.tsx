'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  override render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border border-destructive bg-destructive/10 p-6"
        >
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          {process.env.NODE_ENV === 'development' && errorInfo && (
            <pre className="mt-4 max-h-[200px] w-full overflow-auto rounded-md bg-muted p-4 text-sm">
              <code>{errorInfo.componentStack}</code>
            </pre>
          )}

          <Button
            onClick={this.handleReset}
            className="mt-6"
            variant="secondary"
          >
            Try again
          </Button>
        </div>
      )
    }

    return children
  }
} 