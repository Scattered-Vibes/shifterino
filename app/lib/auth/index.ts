// Re-export server-side auth utilities
export type { UserRole, AuthenticatedUser } from './server'
export { requireAuth, getAuthUser, signOut as signOutServer } from './server'

// Re-export client-side auth utilities
export {
  signOutClient,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  useAuthListener,
  getAuthChangeHandler,
} from './client' 