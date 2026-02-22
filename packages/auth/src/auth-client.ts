import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, magicLinkClient, organizationClient, adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    magicLinkClient(),
    organizationClient(),
    adminClient(),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
