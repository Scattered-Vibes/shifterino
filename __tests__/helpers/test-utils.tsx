import { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Create a custom render function that includes providers
export function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

// Mock next/navigation
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock server actions
export function mockServerAction<T>(implementation: () => Promise<T>) {
  return vi.fn().mockImplementation(implementation)
}

// Reset all mocks between tests
export function resetMocks() {
  vi.clearAllMocks()
  mockRouter.push.mockReset()
  mockRouter.replace.mockReset()
  mockRouter.refresh.mockReset()
} 