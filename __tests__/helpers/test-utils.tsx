import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { cookies } from 'next/headers';
import userEvent from '@testing-library/user-event';
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  })
}));

export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn()
  }
}

vi.mock('@/lib/supabase/clientInstance', () => ({
  createClient: () => mockSupabaseClient
}))

export function renderWithProviders(ui: React.ReactElement) {
  const user = userEvent.setup();
  return {
    user,
    ...render(ui),
    mockSupabaseClient
  };
}

export const waitForLoadingToComplete = async () => {
  // Add a small delay to allow for state updates
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockConsoleError = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

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