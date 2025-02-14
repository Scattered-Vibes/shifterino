// Client-side hooks
export {
  useAuthListener,
  type AuthenticatedUser,
  type UserRole
} from '@/lib/auth/client'

export {
  useRealtimeSubscription,
  useShiftSubscription,
  useSwapRequestSubscription,
  useTimeOffRequestSubscription,
  useStaffingRequirementSubscription
} from './client/useRealtimeSubscription'

export {
  useShiftSubscription as useShiftEvents,
  useSwapRequestSubscription as useSwapRequestEvents,
  useStaffingRequirementSubscription as useStaffingRequirementEvents,
  type SubscriptionCallbacks
} from './client/useTableSubscriptions'

// Server-side hooks and utilities
export {
  getUser,
  requireAuth,
  requireRole,
  verifyAccess
} from '@/lib/auth/server'

// Error handling
export {
  handleError,
  mapErrorToToast,
  type AppError
} from '@/lib/utils/errorHandling'

// Rate limiting
export {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  type RateLimiter
} from '@/lib/middleware/supabase-rate-limit'

// Client-side hooks
export * from './client/use-auth'
export * from './client/use-media-query'
export * from './client/use-toast'

// Server-side hooks
export * from './server/use-employee-schedule'
export * from './server/use-error-handler'
export {
  useSchedules,
  useEmployees,
  useScheduleShifts,
  useCreateShift
} from './server/use-query'
export * from './server/use-shifts'
export * from './server/use-shift-swaps'
export * from './server/use-time-off' 