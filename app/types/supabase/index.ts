// Re-export database types
export * from './database';

// Supabase specific types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Realtime types
export interface RealtimeChannel {
  subscribe: (callback: (payload: unknown) => void) => void;
  unsubscribe: () => void;
}

export interface RealtimeClient {
  channel: (name: string) => RealtimeChannel;
  disconnect: () => void;
} 