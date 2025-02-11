/**
 * SignUpPage Component
 *
 * A client-side component that handles user registration for the 911 Dispatch Center.
 * Provides a form for collecting user information and handles the signup process.
 *
 * Features:
 * - Collects user's first name, last name, email, password
 * - Allows selection of preferred shift pattern (Pattern A or B)
 * - Handles form submission and displays loading/error states
 * - Provides navigation to login page for existing users
 *
 * @component
 * @example
 * ```tsx
 * <SignUpPage />
 * ```
 */
import { SignupForm } from './signup-form'

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>
      <SignupForm />
    </>
  )
}
