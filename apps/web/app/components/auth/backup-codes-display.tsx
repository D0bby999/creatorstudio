import { Button } from '@creator-studio/ui/components/button'

interface BackupCodesDisplayProps {
  codes: string[]
}

export function BackupCodesDisplay({ codes }: BackupCodesDisplayProps) {
  const copyAll = async () => {
    await navigator.clipboard.writeText(codes.join('\n'))
  }

  const download = () => {
    const content = [
      'Creator Studio — Backup Codes',
      'Keep these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...codes,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'creator-studio-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/50 p-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, i) => (
            <code key={i} className="rounded bg-background px-3 py-1.5 text-sm font-mono text-center border">
              {code}
            </code>
          ))}
        </div>
      </div>

      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
        Save these codes — they won't be shown again.
        Each code can only be used once.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={copyAll}>
          Copy all
        </Button>
        <Button variant="outline" className="flex-1" onClick={download}>
          Download .txt
        </Button>
      </div>
    </div>
  )
}
