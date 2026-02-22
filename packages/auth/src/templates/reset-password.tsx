import { Section, Text, Button } from '@react-email/components'
import { render } from '@react-email/components'
import { EmailLayout } from './email-layout'

interface ResetPasswordProps {
  userName: string
  resetUrl: string
}

function ResetPasswordTemplate({ userName, resetUrl }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your Creator Studio password">
      <Section style={content}>
        <Text style={heading}>Reset your password</Text>
        <Text style={paragraph}>
          Hi {userName}, we received a request to reset your password.
          Click the button below to choose a new password.
        </Text>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
        <Text style={smallText}>
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export async function renderResetPassword(props: ResetPasswordProps): Promise<string> {
  return render(<ResetPasswordTemplate {...props} />)
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
