'use client'

import { Component, type ReactNode } from 'react'

/**
 * Props interface for the ErrorBoundary component.
 *
 * @property children - The child components to render.
 */
interface Props {
  children: ReactNode
}

/**
 * State interface for the ErrorBoundary component.
 *
 * @property hasError - Indicates whether an error has been caught.
 * @property error - The caught error, if any.
 */
interface State {
  hasError: boolean
  error: Error | null
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
    this.state = { hasError: false, error: null }
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
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  /**
   * Renders the fallback UI when an error occurs, 
   * otherwise renders the child components.
   *
   * @returns The fallback UI if an error has been caught, or the child components.
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mb-4 text-gray-600">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            <pre className="mb-4 max-h-40 overflow-auto rounded bg-gray-100 p-4 text-sm">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}