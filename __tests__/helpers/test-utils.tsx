import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../setup';
import { createMockSupabaseClient } from '../helpers/supabase-mock';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseProvider } from '../../app/providers/supabase-provider';
import { vi } from 'vitest';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { User } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => createMockSupabaseClient(),
}));

interface ProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  supabaseClient?: ReturnType<typeof createBrowserClient>;
  initialUser?: User | null;
}

function Providers({
  children,
  queryClient = createTestQueryClient(),
  supabaseClient = createMockSupabaseClient(),
  initialUser = null,
}: ProvidersProps) {
  return (
    <SupabaseProvider supabaseClient={supabaseClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={initialUser}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </SupabaseProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  supabaseClient?: ReturnType<typeof createBrowserClient>;
  initialUser?: User | null;
}

function render(
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    supabaseClient = createMockSupabaseClient(),
    initialUser = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <Providers
        queryClient={queryClient}
        supabaseClient={supabaseClient}
        initialUser={initialUser}
      >
        {children}
      </Providers>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: TestWrapper as React.ComponentType, ...renderOptions }),
    queryClient,
    supabaseClient,
    initialUser,
  };
}

// Re-export everything
export * from '@testing-library/react';
export { render };
export { Providers };

// Common test utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const createTestId = (name: string) => `test-${name}`;

export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}; 