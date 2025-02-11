import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createMockSupabaseClient() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  } as unknown as SupabaseClient<Database>
} 