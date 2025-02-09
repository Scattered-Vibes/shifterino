import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { QueryClient } from '@tanstack/react-query';
import { createMockSupabaseClient } from './helpers/supabase-mock';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

// Extend Jest matchers
expect.extend(matchers);

// Mock window.React to ensure JSX works
global.React = React;

// Set up environment variables before any tests run
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock cookies for server components
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn().mockReturnValue({ value: 'mock-cookie' }),
    getAll: vi.fn().mockReturnValue([{ name: 'mock-cookie', value: 'mock-value' }]),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock Supabase with more complete implementation
vi.mock('@supabase/ssr', () => {
  const mockClient = createMockSupabaseClient();
  return {
    createServerClient: () => mockClient,
    createBrowserClient: () => mockClient,
    createServerComponentClient: () => mockClient,
    createClientComponentClient: () => mockClient,
  };
});

// Mock console.error and console.warn for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('not wrapped in act') || 
       args[0].includes('React.createElement: type is invalid') ||
       args[0].includes('Multiple GoTrueClient instances'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: Parameters<typeof console.warn>) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('not wrapped in act') ||
       args[0].includes('componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test client setup
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

// Helper to mock console.error in specific tests
export const mockConsoleError = () => {
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

// Mock Next.js image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => 
    React.createElement('img', { src, alt, ...props }),
}));

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
// @ts-expect-error - TextDecoder types mismatch between Node and DOM
global.TextDecoder = TextDecoder;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
});

vi.mock('next/navigation', () => {
  const actual = {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      pathname: '/',
    }),
    usePathname: () => '/',
    useParams: () => ({}),
    useSearchParams: () => {
      const searchParams = new URLSearchParams()
      return {
        get: (key: string) => searchParams.get(key),
        getAll: (key: string) => searchParams.getAll(key),
        has: (key: string) => searchParams.has(key),
        forEach: (callback: (value: string, key: string) => void) => 
          searchParams.forEach(callback),
        entries: () => searchParams.entries(),
        keys: () => searchParams.keys(),
        values: () => searchParams.values(),
        toString: () => searchParams.toString(),
        size: searchParams.size,
        append: (key: string, value: string) => searchParams.append(key, value),
        delete: (key: string) => searchParams.delete(key),
        set: (key: string, value: string) => searchParams.set(key, value)
      }
    },
    redirect: vi.fn()
  }
  
  return actual
}) 