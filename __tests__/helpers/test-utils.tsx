import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { AuthProvider } from '@/components/providers/AuthProvider'

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>,
    options
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
  redirect: vi.fn(),
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

export * from '@testing-library/react'
export { renderWithProviders as render }
export { Providers } from '@/app/providers/root-provider' 