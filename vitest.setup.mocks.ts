import './vitest.setup'
import { vi } from 'vitest'
import { formMocks } from './__tests__/helpers/form-state-mock'
import '@testing-library/jest-dom'

// Mock react-dom first to ensure proper hoisting
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>()
  return {
    ...actual,
    useFormState: formMocks.useFormState,
    useFormStatus: formMocks.useFormStatus
  }
})

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}))

// Mock server actions
vi.mock('react-dom', () => ({
  useFormState: vi.fn((action) => [null, action]),
  useFormStatus: vi.fn(() => ({ pending: false })),
}))

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createClientComponentClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
  createServerComponentClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
})) 