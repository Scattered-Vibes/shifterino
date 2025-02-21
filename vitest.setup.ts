import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { formMocks } from './__tests__/helpers/form-state-mock';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
  redirect: vi.fn(),
}));

// Mock react-dom for form state
vi.mock('react-dom', () => {
  const actual = vi.importActual('react-dom');
  return {
    ...actual,
    useFormState: formMocks.useFormState,
    useFormStatus: formMocks.useFormStatus,
  };
});

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  })),
})); 