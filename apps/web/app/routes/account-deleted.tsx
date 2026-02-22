import { Link } from 'react-router'
import { AuthLayout } from '~/components/auth/auth-layout'

export default function AccountDeleted() {
  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Account scheduled for deletion</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account will be permanently deleted in 30 days.
            If you change your mind, simply sign in again to reactivate your account.
          </p>
        </div>
        <Link
          to="/sign-in"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in to cancel deletion
        </Link>
      </div>
    </AuthLayout>
  )
}
