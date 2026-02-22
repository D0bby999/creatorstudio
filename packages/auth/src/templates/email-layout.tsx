import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Creator Studio</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by{' '}
              <Link href={process.env.BETTER_AUTH_URL || 'http://localhost:5173'} style={link}>
                Creator Studio
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
}

const header = { padding: '32px 40px 0' }
const logo = { fontSize: '24px', fontWeight: '700' as const, color: '#1a1a1a' }
const hr = { borderColor: '#e6ebf1', margin: '32px 40px' }
const footer = { padding: '0 40px' }
const footerText = { color: '#8898aa', fontSize: '12px', lineHeight: '16px' }
const link = { color: '#556cd6', textDecoration: 'underline' }
