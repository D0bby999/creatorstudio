import { useRef, useState } from 'react'
import { Input } from '@creator-studio/ui/components/input'

interface TotpInputProps {
  onComplete: (code: string) => void
  disabled?: boolean
}

export function TotpInput({ onComplete, disabled }: TotpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '')
    if (!sanitized && !value) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }

    // Handle paste of full code
    if (sanitized.length >= 6) {
      const pasted = sanitized.slice(0, 6).split('')
      setDigits(pasted)
      inputRefs.current[5]?.focus()
      onComplete(pasted.join(''))
      return
    }

    const next = [...digits]
    next[index] = sanitized.slice(-1)
    setDigits(next)

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    const code = next.join('')
    if (code.length === 6 && next.every(Boolean)) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[\s-]/g, '').replace(/\D/g, '')
    if (pasted.length >= 6) {
      const code = pasted.slice(0, 6).split('')
      setDigits(code)
      inputRefs.current[5]?.focus()
      onComplete(code.join(''))
    }
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el: HTMLInputElement | null) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-mono"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}
