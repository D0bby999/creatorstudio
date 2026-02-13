import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, magicLinkClient, organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    magicLinkClient(),
    organizationClient(),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
