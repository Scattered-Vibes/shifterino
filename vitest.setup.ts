import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { QueryClient } from '@tanstack/react-query'
import React from 'react'
import { TextEncoder, TextDecoder } from 'util'
import { NextResponse } from 'next/server'
import { mockSupabaseAuth } from './__tests__/helpers/auth'

// Extend Jest matchers
expect.extend(matchers)

// Mock window.React to ensure JSX works
global.React = React

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock cookies for server components
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: () => []
  }),
  headers: () => new Headers()
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useTransition: () => [false, vi.fn()],
    useState: actual.useState,
    useEffect: actual.useEffect,
    useCallback: actual.useCallback,
    createContext: actual.createContext,
    useContext: actual.useContext,
    useMemo: actual.useMemo
  }
})

// Mock react-dom
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    useFormState: vi.fn(() => [null, vi.fn()]),
    useFormStatus: vi.fn(() => ({
      pending: false,
      data: null,
      method: null,
      action: null
    }))
  }
})

// Mock the Icons component
vi.mock('@/components/ui/icons', () => ({
  Icons: {
    spinner: () => React.createElement('div', { 'data-testid': 'spinner' })
  }
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Global test client setup
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
      staleTime: Infinity,
    },
  },
})

// Mock console.error in specific tests
export const mockConsoleError = () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
}

// Mock Next.js image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => 
    React.createElement('img', { src, alt, ...props }),
}))

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder
// @ts-expect-error - TextDecoder types mismatch between Node and DOM
global.TextDecoder = TextDecoder

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => mockSupabaseAuth(),
  createBrowserClient: () => mockSupabaseAuth()
}))

// Add JSDOM form submission polyfill
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function () {
    this.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  }
}

// Mock Supabase to avoid multiple instances warning
vi.mock('@/lib/supabase/middleware', () => ({
  createClient: vi.fn(() => ({
    supabase: {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn()
      }
    },
    response: NextResponse.next()
  }))
})) 