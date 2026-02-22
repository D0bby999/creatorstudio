import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@creator-studio/ui/components/button'

interface QrCodeDisplayProps {
  totpUri: string
  secret: string
}

export function QrCodeDisplay({ totpUri, secret }: QrCodeDisplayProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg border bg-white p-4">
        <QRCodeSVG value={totpUri} size={200} level="M" />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Scan this QR code with your authenticator app
        (Google Authenticator, Authy, 1Password)
      </p>

      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowSecret(!showSecret)}
        >
          {showSecret ? 'Hide' : 'Show'} secret key (manual entry)
        </Button>

        {showSecret && (
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 text-xs font-mono break-all">{secret}</code>
            <Button variant="ghost" size="sm" onClick={copySecret}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
