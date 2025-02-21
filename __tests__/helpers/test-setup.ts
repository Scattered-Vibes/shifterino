import { vi, expect, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { loadEnvConfig } from '@next/env';
import { formMocks } from '../mocks/react-dom';

// Load test environment variables
loadEnvConfig(process.cwd());

// Extend matchers
expect.extend(matchers);

// Augment Vitest's expect interface
declare module 'vitest' {
  interface Assertion<T = any> extends matchers.TestingLibraryMatchers<T, void> {}
}

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`Redirect to ${url}`); }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn((name) => ({ value: `mock-${name}` })),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  }),
}))

// Mock Supabase with enhanced functionality
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({ subscribe: vi.fn() })),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
  createClient: vi.fn(() => mockSupabase),
  createBrowserClient: vi.fn(() => mockSupabase)
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Export Supabase mock
export { mockSupabase };

// Test lifecycle hooks
beforeEach(() => {
  console.log('[Setup] Running beforeEach');
  vi.clearAllMocks();
  formMocks.reset();
});

afterEach(() => {
  console.log('[Setup] Running afterEach');
  cleanup();
  vi.clearAllMocks();
});

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Debug logs
console.log('[Setup] Test setup complete'); 