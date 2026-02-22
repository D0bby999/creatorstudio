import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@creatorstudio.app'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (!resend) {
    console.warn(`[Email] No RESEND_API_KEY — logging email instead`)
    console.info(`[Email] To: ${to} | Subject: ${subject}`)
    return
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  })

  if (error) {
    console.error(`[Email] Failed to send to ${to}:`, error.message)
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}
