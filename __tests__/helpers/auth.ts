import { vi } from 'vitest';
import type { User, AuthError } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

export const mockSupabaseUser: User = {
  id: 'test-user-id',
  app_metadata: { provider: 'email', role: 'dispatcher' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: undefined,
  identities: [],
  factors: [],
} as User;

export const mockSession: Session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockSupabaseUser,
} as Session;

export const mockAuthError: AuthError = {
  name: 'AuthApiError',
  status: 400,
  message: 'Invalid login credentials',
} as AuthError;

export const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          data: { user: mockSupabaseUser, session: mockSession },
          error: null,
        });
      }
      return Promise.resolve({
        data: { user: null, session: null },
        error: mockAuthError,
      });
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
};

// Mock cookies store
export const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
};

// Mock headers
export const mockHeaders = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  append: vi.fn(),
  entries: vi.fn().mockReturnValue([]),
  forEach: vi.fn(),
};

// Helper for form data creation
export function createFormData(data: Record<string, string>) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

// Helper for async state updates
export async function waitForStateUpdate(timeout = 100) {
  await new Promise(resolve => setTimeout(resolve, timeout));
}