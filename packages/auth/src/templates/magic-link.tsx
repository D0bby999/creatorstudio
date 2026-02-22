import { Section, Text, Button } from '@react-email/components'
import { render } from '@react-email/components'
import { EmailLayout } from './email-layout'

interface MagicLinkProps {
  magicLinkUrl: string
}

function MagicLinkTemplate({ magicLinkUrl }: MagicLinkProps) {
  return (
    <EmailLayout preview="Sign in to Creator Studio">
      <Section style={content}>
        <Text style={heading}>Sign in to Creator Studio</Text>
        <Text style={paragraph}>
          Click the button below to sign in to your account. No password needed.
        </Text>
        <Button style={button} href={magicLinkUrl}>
          Sign In
        </Button>
        <Text style={smallText}>
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export async function renderMagicLink(props: MagicLinkProps): Promise<string> {
  return render(<MagicLinkTemplate {...props} />)
}

const content = { padding: '0 40px' }
const heading = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a1a', marginBottom: '16px' }
const paragraph = { fontSize: '14px', lineHeight: '24px', color: '#525f7f' }
const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
}
const smallText = { fontSize: '12px', color: '#8898aa', lineHeight: '20px' }
