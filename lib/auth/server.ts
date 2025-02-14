import { getSessionUser, requireAuth, type AuthenticatedUser } from './core'
import { handleError } from '@/lib/utils/error-handler'

export { type AuthenticatedUser }

export async function getUser() {
  try {
    return await getSessionUser()
  } catch (error) {
    const appError = handleError(error as Error)
    console.error('Error in getUser:', appError)
    throw appError
  }
}

export { requireAuth }

// Re-export core functions
export * from './core' 