import { useState } from 'react'
import { Form, useFetcher } from 'react-router'
import { Instagram, Plus, Calendar, TrendingUp, Cloud, X } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/social'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  // Fetch user's social accounts
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch recent posts
  const recentPosts = await prisma.socialPost.findMany({
    where: {
      socialAccount: {
        userId: session.user.id,
      },
    },
    include: {
      socialAccount: {
        select: {
          platform: true,
          username: true,
        },
      },
      analytics: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Calculate aggregate stats
  const publishedPosts = recentPosts.filter((p) => p.status === 'published')
  const totalImpressions = publishedPosts.reduce(
    (sum, p) => sum + (p.analytics?.impressions || 0),
    0
  )
  const totalEngagement = publishedPosts.reduce(
    (sum, p) =>
      sum +
      (p.analytics?.likes || 0) +
      (p.analytics?.comments || 0) +
      (p.analytics?.shares || 0),
    0
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
  const [showComposer, setShowComposer] = useState(false)
  const [showBlueskyConnect, setShowBlueskyConnect] = useState(false)
  const connectFetcher = useFetcher()
  const disconnectFetcher = useFetcher()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Management</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Manage your social media accounts and schedule posts
          </p>
        </div>
        <Button onClick={() => setShowComposer(!showComposer)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Posts</p>
              <p className="mt-1 text-2xl font-bold">{stats.totalPosts}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Impressions</p>
              <p className="mt-1 text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Engagement</p>
              <p className="mt-1 text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Scheduled</p>
              <p className="mt-1 text-2xl font-bold">{stats.scheduledPosts}</p>
            </div>
            <Calendar className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          </div>
        </Card>
      </div>

      {/* Connected Accounts */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBlueskyConnect(!showBlueskyConnect)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Bluesky
          </Button>
        </div>

        {/* Bluesky Connection Form */}
        {showBlueskyConnect && (
          <div className="mb-4 rounded-lg border border-[hsl(var(--border))] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Connect Bluesky Account</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlueskyConnect(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <connectFetcher.Form method="post" action="/api/social/connect" className="space-y-3">
              <input type="hidden" name="action" value="connectBluesky" />
              <div>
                <Label htmlFor="handle">Handle</Label>
                <Input
                  id="handle"
                  name="handle"
                  type="text"
                  placeholder="username.bsky.social"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="appPassword">App Password</Label>
                <Input
                  id="appPassword"
                  name="appPassword"
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Generate an app password in your Bluesky settings
                </p>
              </div>
              {connectFetcher.data?.error && (
                <p className="text-sm text-red-600">{connectFetcher.data.error}</p>
              )}
              {connectFetcher.data?.success && (
                <p className="text-sm text-green-600">
                  Connected @{connectFetcher.data.username} successfully!
                </p>
              )}
              <Button
                type="submit"
                disabled={connectFetcher.state === 'submitting'}
              >
                {connectFetcher.state === 'submitting' ? 'Connecting...' : 'Connect'}
              </Button>
            </connectFetcher.Form>
          </div>
        )}

        {socialAccounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-8 text-center">
            <Cloud className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 font-medium">No accounts connected</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Connect your social media accounts to start scheduling posts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {socialAccounts.map((account) => {
              const PlatformIcon = account.platform === 'bluesky' ? Cloud : Instagram
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-4"
                >
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">@{account.username}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                      </p>
                    </div>
                  </div>
                  <disconnectFetcher.Form method="post" action="/api/social/connect">
                    <input type="hidden" name="action" value="disconnect" />
                    <input type="hidden" name="accountId" value={account.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={disconnectFetcher.state === 'submitting'}
                    >
                      {disconnectFetcher.state === 'submitting' ? 'Removing...' : 'Disconnect'}
                    </Button>
                  </disconnectFetcher.Form>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Post Composer */}
      {showComposer && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-lg font-semibold">Create Post</h2>
          <Form method="post" className="space-y-4">
            <div>
              <Label htmlFor="content">Caption</Label>
              <textarea
                id="content"
                name="content"
                rows={4}
                className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                placeholder="Write your caption..."
              />
            </div>

            <div>
              <Label htmlFor="mediaUrl">Media URL</Label>
              <Input
                id="mediaUrl"
                name="mediaUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Must be a publicly accessible URL
              </p>
            </div>

            <div>
              <Label htmlFor="account">Account</Label>
              <select
                id="account"
                name="socialAccountId"
                className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2"
              >
                {socialAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    @{account.username} ({account.platform})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="scheduledAt">Schedule (optional)</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" name="action" value="publish">
                Publish Now
              </Button>
              <Button type="submit" name="action" value="schedule" variant="outline">
                Schedule
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Recent Posts */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Posts</h2>

        {recentPosts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-8 text-center">
            <p className="font-medium">No posts yet</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Create your first post to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between rounded-lg border border-[hsl(var(--border))] p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      @{post.socialAccount.username}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{post.content.slice(0, 100)}...</p>
                  {post.analytics && (
                    <div className="mt-2 flex gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                      <span>{post.analytics.likes} likes</span>
                      <span>{post.analytics.comments} comments</span>
                      <span>{post.analytics.impressions} impressions</span>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-[hsl(var(--muted-foreground))]">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : post.scheduledAt
                      ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`
                      : 'Draft'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
