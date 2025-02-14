'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    {
      text: 'At least 8 characters',
      test: (pass: string) => pass.length >= 8,
    },
    {
      text: 'At least one uppercase letter',
      test: (pass: string) => /[A-Z]/.test(pass),
    },
    {
      text: 'At least one lowercase letter',
      test: (pass: string) => /[a-z]/.test(pass),
    },
    {
      text: 'At least one number',
      test: (pass: string) => /[0-9]/.test(pass),
    },
    {
      text: 'At least one special character (@$!%*?&)',
      test: (pass: string) => /[@$!%*?&]/.test(pass),
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Password Requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const isMet = password ? req.test(password) : false
          return (
            <li
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              {isMet ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isMet ? 'text-green-700' : 'text-red-700'}>
                {req.text}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
} 