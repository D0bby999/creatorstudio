import { cn } from '@creator-studio/ui/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
}

type Strength = 'weak' | 'fair' | 'good' | 'strong'

function getStrength(password: string): { score: number; label: Strength } {
  if (!password) return { score: 0, label: 'weak' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'weak' }
  if (score <= 2) return { score: 2, label: 'fair' }
  if (score <= 3) return { score: 3, label: 'good' }
  return { score: 4, label: 'strong' }
}

const colors: Record<Strength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-yellow-500',
  good: 'bg-blue-500',
  strong: 'bg-green-500',
}

const textColors: Record<Strength, string> = {
  weak: 'text-red-600 dark:text-red-400',
  fair: 'text-yellow-600 dark:text-yellow-400',
  good: 'text-blue-600 dark:text-blue-400',
  strong: 'text-green-600 dark:text-green-400',
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null

  const { score, label } = getStrength(password)

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors', i <= score ? colors[label] : 'bg-muted')}
          />
        ))}
      </div>
      <p className={cn('text-xs capitalize', textColors[label])}>{label}</p>
    </div>
  )
}
