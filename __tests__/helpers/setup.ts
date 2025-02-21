import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { execSync } from 'child_process'

// Extend matchers
expect.extend(matchers)

// JSDOM Form Submit Fix
beforeAll(() => {
  if (!globalThis.HTMLFormElement.prototype.requestSubmit) {
    globalThis.HTMLFormElement.prototype.requestSubmit = function() {
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true })
      const dispatched = this.dispatchEvent(submitEvent)
      if (!submitEvent.defaultPrevented && dispatched) {
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

export async function setupTestEnvironment() {
  try {
    // Reset database and verify status
    execSync('npm run test:setup', { stdio: 'inherit' })
    
    return true
  } catch (error) {
    console.error('Error setting up test environment:', error)
    return false
  }
}

export async function teardownTestEnvironment() {
  try {
    // Clean up any test-specific resources
    return true
  } catch (error) {
    console.error('Error tearing down test environment:', error)
    return false
  }
} 