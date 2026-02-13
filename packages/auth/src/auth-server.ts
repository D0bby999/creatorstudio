import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor, magicLink, organization } from 'better-auth/plugins'
import { prisma } from '@creator-studio/db'

export const auth = betterAuth({
  appName: 'Creator Studio',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
        console.log(`[Magic Link] ${email}: ${url}`)
      },
    }),
    organization(),
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
