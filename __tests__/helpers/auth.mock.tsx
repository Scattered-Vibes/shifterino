import { vi } from 'vitest'
import type { User, Session } from '@supabase/supabase-js'
import React from 'react'

export const createMockAuthState = (overrides?: Partial<User>) => {
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    app_metadata: { provider: 'email', role: 'dispatcher' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: undefined,
    identities: [],
    factors: [],
    ...overrides
  }

  const session: Session = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user
  }

  return { user, session }
}

interface TestWrapperProps {
  children: React.ReactNode
}

export function createTestWrapper() {
  return function TestWrapper({ children }: TestWrapperProps) {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    )
  }
} 