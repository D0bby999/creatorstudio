import { Section, Text, Button } from '@react-email/components'
import { render } from '@react-email/components'
import { EmailLayout } from './email-layout'

interface VerifyEmailProps {
  userName: string
  verificationUrl: string
}

function VerifyEmailTemplate({ userName, verificationUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address for Creator Studio">
      <Section style={content}>
        <Text style={heading}>Verify your email</Text>
        <Text style={paragraph}>
          Hi {userName}, thanks for signing up for Creator Studio.
          Please verify your email address by clicking the button below.
        </Text>
        <Button style={button} href={verificationUrl}>
          Verify Email Address
        </Button>
        <Text style={smallText}>
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export async function renderVerifyEmail(props: VerifyEmailProps): Promise<string> {
  return render(<VerifyEmailTemplate {...props} />)
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
