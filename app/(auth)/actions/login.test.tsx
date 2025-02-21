import { vi, describe, test, expect } from 'vitest';
import { login } from './login';
import { createAuthMocks } from '@/__tests__/helpers/auth-mocks';
import { createServerClient } from '@supabase/ssr';
import { AuthError } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Mock createServerClient
const mockCreateServerClient = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: any[]) => mockCreateServerClient(...args)
}));

describe('Login Action', () => {
  beforeEach(() => {
    const { supabase } = createAuthMocks();
    mockCreateServerClient.mockReturnValue(supabase);
  });

  test('handles successful login', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');

    const result = await login(null, formData);
    expect(result).toEqual({ success: true });
  });

  test('handles invalid credentials', async () => {
    const { supabase } = createAuthMocks({
      error: new AuthError('Invalid credentials', 401, 'invalid_credentials')
    });

    mockCreateServerClient.mockReturnValueOnce(supabase);

    const formData = new FormData();
    formData.append('email', 'wrong@example.com');
    formData.append('password', 'wrongpass');

    const result = await login(null, formData);
    expect(result).toEqual({ error: { message: 'Invalid credentials' } });
  });

  test('requires email field', async () => {
    const formData = new FormData();
    formData.append('password', 'password123');

    const result = await login(null, formData);
    expect(result).toEqual({ error: { message: 'Email is required' } });
  });

  test('requires password field', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');

    const result = await login(null, formData);
    expect(result).toEqual({ error: { message: 'Password is required' } });
  });

  test('handles network errors', async () => {
    const { supabase } = createAuthMocks({
      error: new AuthError('Network error', 500, 'network_error')
    });

    mockCreateServerClient.mockReturnValueOnce(supabase);

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');

    const result = await login(null, formData);
    expect(result).toEqual({ error: { message: 'Network error' } });
  });
}); 