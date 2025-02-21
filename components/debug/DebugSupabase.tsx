'use client'

import { useSupabase } from '@/app/providers/supabase-provider'

export function DebugSupabase() {
  try {
    const supabase = useSupabase()
    console.log('Supabase context available:', !!supabase)
    return <div>Supabase Context: Available</div>
  } catch (error) {
    console.error('Supabase context error:', error)
    return <div>Supabase Context: Missing - {(error as Error).message}</div>
  }
} 