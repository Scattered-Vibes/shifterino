import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren, ReactNode } from 'react'

// Extend matchers
expect.extend(matchers)

// JSDOM Form Submit Fix
beforeAll(() => {
  if (!HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function() {
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true })
      this.dispatchEvent(submitEvent)
      if (!submitEvent.defaultPrevented) {
        this.submit()
      }
    }
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Test wrapper with providers
export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function TestWrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
} 