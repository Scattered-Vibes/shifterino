import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { createMockSupabaseClient } from '../helpers/supabase-mock'

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn().mockReturnValue(createMockSupabaseClient())
}))

export function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}

export * from '@testing-library/react' 