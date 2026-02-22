import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor, magicLink, organization, admin } from 'better-auth/plugins'
import { prisma } from '@creator-studio/db'
import { sendEmail } from './lib/email-sender'
import { renderVerifyEmail } from './templates/verify-email'
import { renderResetPassword } from './templates/reset-password'
import { renderMagicLink } from './templates/magic-link'

export const auth = betterAuth({
  appName: 'Creator Studio',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password — Creator Studio',
        html: await renderResetPassword({ userName: user.name, resetUrl: url }),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email — Creator Studio',
        html: await renderVerifyEmail({ userName: user.name, verificationUrl: url }),
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    twoFactor({
      issuer: 'Creator Studio',
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: 'Sign in to Creator Studio',
          html: await renderMagicLink({ magicLinkUrl: url }),
        })
      },
    }),
    organization(),
    admin(),
  ],
  rateLimit: {
    window: 60,
    max: 10,
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
})

export type Session = typeof auth.$Infer.Session
