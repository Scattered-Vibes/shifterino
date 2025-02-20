'use client'

import { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class RealtimeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('RealtimeErrorBoundary caught an error:', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Real-time Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">Failed to maintain real-time connection. Updates may be delayed.</p>
            <Button 
              variant="outline" 
              onClick={this.handleRetry}
              className="gap-2"
            >
              <ReloadIcon className="h-4 w-4" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
} 