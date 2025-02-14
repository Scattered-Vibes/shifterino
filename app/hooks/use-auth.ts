import { useSupabase } from '@/app/providers'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { supabase } = useSupabase()
  const router = useRouter()

  const signIn = async (email: string, password: string) => {
    console.log('useAuth: Attempting sign in with Supabase')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log('useAuth: Sign in response:', { data, error })

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    router.push('/login')
  }

  return {
    signIn,
    signOut,
  }
} 