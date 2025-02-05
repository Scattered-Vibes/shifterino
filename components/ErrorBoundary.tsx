'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

/**
 * Props interface for the ErrorBoundary component.
 *
 * @property children - The child components to render.
 * @property fallback - The fallback component to render when an error occurs.
 */
interface Props {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * State interface for the ErrorBoundary component.
 *
 * @property hasError - Indicates whether an error has been caught.
 * @property error - The caught error (if any).
 */
interface State {
  hasError: boolean
  error?: Error
}

/**
 * ErrorBoundary Component.
 *
 * Catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * @remarks
 * This component is designated as a client component.
 */
export class ErrorBoundary extends Component<Props, State> {
  /**
   * Constructs a new ErrorBoundary instance.
   *
   * @param props - The props provided to the component.
   */
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  /**
   * Updates the state to render the fallback UI after an error is thrown.
   *
   * This lifecycle method is invoked when a descendant component throws an error.
   *
   * @param error - The error that was thrown.
   * @returns An object with updated state indicating an error has occurred.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /**
   * Logs error details after an error is caught.
   *
   * @param error - The error that was caught.
   * @param errorInfo - Additional information about the error.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  /**
   * Renders the fallback UI when an error occurs, 
   * otherwise renders the child components.
   *
   * @returns The fallback UI if an error has been caught, or the child components.
   */
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          {this.state.error && (
            <p className="mt-2 text-sm text-red-600">{this.state.error.message}</p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}