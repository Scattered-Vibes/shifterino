declare interface AuthenticatedUser {
  userId: string;
  employeeId: string;
  role: 'dispatcher' | 'supervisor' | 'manager';
  email: string;
  isNewUser: boolean;
}

declare type AuthError = {
  message: string;
  code?: string;
} 