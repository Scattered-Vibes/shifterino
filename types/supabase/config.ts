export interface SupabaseConfig {
  auth?: {
    autoRefreshToken?: boolean
    persistSession?: boolean
    detectSessionInUrl?: boolean
    flowType?: 'implicit' | 'pkce'
  }
  global?: {
    headers?: Record<string, string>
  }
  cookies?: {
    name?: string
    lifetime?: number
    domain?: string
    sameSite?: 'lax' | 'strict' | 'none'
    secure?: boolean
  }
} 