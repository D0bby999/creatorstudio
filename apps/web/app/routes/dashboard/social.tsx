import { useState } from 'react'
import { Form, useFetcher } from 'react-router'
import { Instagram, Plus, Calendar, TrendingUp, Cloud, X, CheckCircle, Clock, FileText } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { Badge } from '@creator-studio/ui/components/badge'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/social'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const recentPosts = await prisma.socialPost.findMany({
    where: { socialAccount: { userId: session.user.id } },
    include: {
      socialAccount: { select: { platform: true, username: true } },
      analytics: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const publishedPosts = recentPosts.filter((p) => p.status === 'published')
  const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.analytics?.impressions || 0), 0)
  const totalEngagement = publishedPosts.reduce(
    (sum, p) => sum + (p.analytics?.likes || 0) + (p.analytics?.comments || 0) + (p.analytics?.shares || 0),
    0,
  )

  return {
    user: session.user,
    socialAccounts,
    recentPosts,
    stats: {
      totalPosts: publishedPosts.length,
      totalImpressions,
      totalEngagement,
      scheduledPosts: recentPosts.filter((p) => p.status === 'scheduled').length,
    },
  }
}

export default function Social({ loaderData }: Route.ComponentProps) {
  const { socialAccounts, recentPosts, stats } = loaderData

  return (
    <div className="p-6">
      <SocialHeader />
      <StatsGrid stats={stats} />
      <ConnectedAccounts accounts={socialAccounts} />
      <RecentPosts posts={recentPosts} accounts={socialAccounts} />
    </div>
  )
}

function SocialHeader() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Social Management</h1>
        <p className="mt-1 text-muted-foreground">Manage your social media accounts and schedule posts</p>
      </div>
    </div>
  )
}

function StatsGrid({ stats }: { stats: { totalPosts: number; totalImpressions: number; totalEngagement: number; scheduledPosts: number } }) {
  const items = [
    { label: 'Total Posts', value: stats.totalPosts, icon: TrendingUp },
    { label: 'Impressions', value: stats.totalImpressions.toLocaleString(), icon: TrendingUp },
    { label: 'Engagement', value: stats.totalEngagement.toLocaleString(), icon: TrendingUp },
    { label: 'Scheduled', value: stats.scheduledPosts, icon: Calendar },
  ]

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
            <Icon className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ConnectedAccounts({ accounts }: { accounts: any[] }) {
  const [showConnect, setShowConnect] = useState(false)
  const connectFetcher = useFetcher()
  const disconnectFetcher = useFetcher()

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <Button variant="outline" size="sm" onClick={() => setShowConnect(!showConnect)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Bluesky
          </Button>
        </div>

        {showConnect && (
          <div className="mb-4 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Connect Bluesky Account</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConnect(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <connectFetcher.Form method="post" action="/api/social/connect" className="space-y-3">
              <input type="hidden" name="action" value="connectBluesky" />
              <div>
                <Label htmlFor="handle">Handle</Label>
                <Input id="handle" name="handle" placeholder="username.bsky.social" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="appPassword">App Password</Label>
                <Input id="appPassword" name="appPassword" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" className="mt-1" required />
                <p className="mt-1 text-sm text-muted-foreground">Generate an app password in your Bluesky settings</p>
              </div>
              {connectFetcher.data?.error && <p className="text-sm text-destructive">{connectFetcher.data.error}</p>}
              {connectFetcher.data?.success && <p className="text-sm text-success">Connected @{connectFetcher.data.username} successfully!</p>}
              <Button type="submit" disabled={connectFetcher.state === 'submitting'}>
                {connectFetcher.state === 'submitting' ? 'Connecting...' : 'Connect'}
              </Button>
            </connectFetcher.Form>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Cloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium">No accounts connected</p>
            <p className="mt-1 text-sm text-muted-foreground">Connect your social media accounts to start scheduling posts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const PlatformIcon = account.platform === 'bluesky' ? Cloud : Instagram
              return (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">@{account.username}</p>
                      <p className="text-sm text-muted-foreground">{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</p>
                    </div>
                  </div>
                  <disconnectFetcher.Form method="post" action="/api/social/connect">
                    <input type="hidden" name="action" value="disconnect" />
                    <input type="hidden" name="accountId" value={account.id} />
                    <Button type="submit" variant="outline" size="sm" disabled={disconnectFetcher.state === 'submitting'}>
                      {disconnectFetcher.state === 'submitting' ? 'Removing...' : 'Disconnect'}
                    </Button>
                  </disconnectFetcher.Form>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PostComposer({ accounts, onClose }: { accounts: any[]; onClose: () => void }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Create Post</h2>
        <Form method="post" className="space-y-4">
          <div>
            <Label htmlFor="content">Caption</Label>
            <textarea id="content" name="content" rows={4} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm" placeholder="Write your caption..." />
          </div>
          <div>
            <Label htmlFor="mediaUrl">Media URL</Label>
            <Input id="mediaUrl" name="mediaUrl" type="url" placeholder="https://example.com/image.jpg" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="account">Account</Label>
            <select id="account" name="socialAccountId" className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm">
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>@{account.username} ({account.platform})</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="scheduledAt">Schedule (optional)</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" className="mt-1" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" name="action" value="publish">Publish Now</Button>
            <Button type="submit" name="action" value="schedule" variant="outline">Schedule</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

const statusConfig = {
  published: { icon: CheckCircle, label: 'Published', className: 'bg-success/10 text-success border-success/20' },
  scheduled: { icon: Clock, label: 'Scheduled', className: 'bg-info/10 text-info border-info/20' },
  draft: { icon: FileText, label: 'Draft', className: 'bg-muted text-muted-foreground' },
} as const

function RecentPosts({ posts, accounts }: { posts: any[]; accounts: any[] }) {
  const [showComposer, setShowComposer] = useState(false)

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Posts</h2>
        <Button size="sm" onClick={() => setShowComposer(!showComposer)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {showComposer && <PostComposer accounts={accounts} onClose={() => setShowComposer(false)} />}

      <Card>
        <CardContent className="p-6">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first post to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const status = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.draft
                const StatusIcon = status.icon
                return (
                  <div key={post.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">@{post.socialAccount.username}</span>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm">{post.content.slice(0, 100)}...</p>
                      {post.analytics && (
                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          <span>{post.analytics.likes} likes</span>
                          <span>{post.analytics.comments} comments</span>
                          <span>{post.analytics.impressions} impressions</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : post.scheduledAt
                          ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`
                          : 'Draft'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
