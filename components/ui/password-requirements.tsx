import { Icons } from '@/components/ui/icons'

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const hasMinLength = password.length >= 8
  const hasMaxLength = password.length <= 100
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[@$!%*?&]/.test(password)

  const requirements = [
    { text: 'At least 8 characters', met: hasMinLength },
    { text: 'Maximum 100 characters', met: hasMaxLength },
    { text: 'One uppercase letter', met: hasUppercase },
    { text: 'One lowercase letter', met: hasLowercase },
    { text: 'One number', met: hasNumber },
    { text: 'One special character (@$!%*?&)', met: hasSpecialChar },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Password Requirements:</p>
      <ul className="text-sm space-y-1">
        {requirements.map(({ text, met }) => (
          <li key={text} className="flex items-center space-x-2">
            {met ? (
              <Icons.check className="h-4 w-4 text-green-500" />
            ) : (
              <Icons.minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={met ? 'text-green-500' : 'text-muted-foreground'}>
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
} 