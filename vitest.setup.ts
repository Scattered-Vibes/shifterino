import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Mock fetch
global.fetch = vi.fn()

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any // Necessary for test environment compatibility

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

// Cleanup after each test case
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Set up any global test configuration
beforeAll(() => {
  // Add any global setup here
}) 