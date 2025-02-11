import type { EmployeeRole } from './index'

declare interface AuthenticatedUser {
  userId: string;
  employeeId: string;
  role: EmployeeRole;
  email: string;
  isNewUser: boolean;
}

declare type AuthError = {
  message: string;
  code?: string;
}

export type { AuthenticatedUser, AuthError } 