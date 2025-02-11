// Client-side hooks
export * from './client/use-auth'
export * from './client/use-media-query'
export * from './client/use-realtime-subscription'

// React Query hooks
export {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from './use-employees'

export {
  useSchedules,
  useSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from './use-schedules'

export {
  useShifts,
  useShift,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from './use-shifts'

export {
  useTimeOffRequests,
  useTimeOffRequest,
  useCreateTimeOffRequest,
  useUpdateTimeOffRequest,
  useDeleteTimeOffRequest,
} from './use-time-off'

export {
  useStaffingRequirements,
  useStaffingRequirement,
  useCreateStaffingRequirement,
  useUpdateStaffingRequirement,
  useDeleteStaffingRequirement,
} from './use-staffing-requirements'

export {
  useShiftSwaps,
  useShiftSwap,
  useCreateShiftSwap,
  useUpdateShiftSwap,
  useDeleteShiftSwap,
} from './use-shift-swaps'

export {
  useLogin,
  useSignUp,
  useResetPassword,
  useUpdatePassword,
} from './use-auth-mutations' 