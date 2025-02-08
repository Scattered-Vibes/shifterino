import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { QueryClient } from '@tanstack/react-query';

expect.extend(matchers);

// Mock config.server.ts
vi.mock('@/lib/config.server', () => ({
  default: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceKey: 'test-service-key',
    },
    app: {
      url: 'http://localhost:3000',
      siteUrl: 'http://localhost:3000',
      domain: 'localhost',
    },
    env: 'test',
  }
}));

// Load test environment variables
beforeAll(() => {
  // Set up test environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_DOMAIN = 'localhost';

  // Mock console.warn to suppress React act() warnings
  const originalWarn = console.warn;
  console.warn = (...args: Parameters<typeof console.warn>) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
      return;
    }
    originalWarn(...args);
  };
});

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test client setup
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
}); 