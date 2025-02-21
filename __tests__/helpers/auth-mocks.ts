import { User, Session, AuthError } from '@supabase/supabase-js'
import { vi } from 'vitest'

export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  factors: [],
  identities: []
}

export const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
}

export const mockAuthState = {
  user: mockUser,
  session: {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: Date.now() + 3600000,
  },
}

export interface AuthMockOptions {
  user?: Partial<User>;
  error?: AuthError | null;
}

export function createAuthMocks(options: AuthMockOptions = {}) {
  const defaultUser: User = { 
    id: 'test-user', 
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    updated_at: new Date().toISOString(),
    ...options.user 
  } as User;
  
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: defaultUser }, 
          error: options.error || null 
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { 
            user: defaultUser,
            session: {
              access_token: 'test-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
              user: defaultUser
            } as Session
          },
          error: options.error || null
        }),
        signOut: vi.fn().mockResolvedValue({
          error: options.error || null
        })
      }
    }
  };
}

export function mockAuthSession(user: Partial<User> | null = null): {
  data: { session: Session | null };
  error: AuthError | null;
} {
  if (!user) {
    return {
      data: { session: null },
      error: null
    };
  }

  const defaultUser: User = {
    id: user.id || 'test-user',
    email: user.email || 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    updated_at: new Date().toISOString(),
    ...user
  } as User;

  return {
    data: { 
      session: {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: defaultUser
      } as Session
    },
    error: null
  };
}