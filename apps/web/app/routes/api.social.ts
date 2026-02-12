// API route for social media operations
// Handles post creation, scheduling, and account connection

import { redirect } from 'react-router'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { schedulePost } from '@creator-studio/social/scheduler'
import { InstagramClient } from '@creator-studio/social/client'

interface ActionArgs {
  request: Request
}

export async function action({ request }: ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const action = formData.get('action')

  try {
    switch (action) {
      case 'publish': {
        // Publish post immediately
        const content = formData.get('content') as string
        const mediaUrl = formData.get('mediaUrl') as string
        const socialAccountId = formData.get('socialAccountId') as string

        if (!content || !mediaUrl || !socialAccountId) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get social account
        const socialAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccountId },
        })

        if (!socialAccount || socialAccount.userId !== session.user.id) {
          return Response.json({ error: 'Social account not found' }, { status: 404 })
        }

        // Create post record
        const post = await prisma.socialPost.create({
          data: {
            content,
            mediaUrls: [mediaUrl],
            platform: socialAccount.platform,
            status: 'publishing',
            socialAccountId,
          },
        })

        // Publish to platform
        if (socialAccount.platform === 'instagram') {
          const client = new InstagramClient(socialAccount.accessToken)
          const response = await client.post({
            userId: socialAccount.platformUserId,
            imageUrl: mediaUrl.endsWith('.mp4') ? undefined : mediaUrl,
            videoUrl: mediaUrl.endsWith('.mp4') ? mediaUrl : undefined,
            caption: content,
          })

          // Update post status
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              platformPostId: response.id,
            },
          })
        }

        return redirect('/dashboard/social')
      }

      case 'schedule': {
        // Schedule post for future
        const content = formData.get('content') as string
        const mediaUrl = formData.get('mediaUrl') as string
        const socialAccountId = formData.get('socialAccountId') as string
        const scheduledAt = formData.get('scheduledAt') as string

        if (!content || !mediaUrl || !socialAccountId || !scheduledAt) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify social account ownership
        const socialAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccountId },
        })

        if (!socialAccount || socialAccount.userId !== session.user.id) {
          return Response.json({ error: 'Social account not found' }, { status: 404 })
        }

        // Schedule the post
        const postId = await schedulePost({
          content,
          mediaUrls: [mediaUrl],
          scheduledAt: new Date(scheduledAt),
          socialAccountId,
        })

        return Response.json({ success: true, postId })
      }

      case 'connect-instagram': {
        // OAuth flow would be handled here
        // For now, return placeholder
        return Response.json({ error: 'Instagram OAuth not implemented' }, { status: 501 })
      }

      case 'disconnect': {
        const socialAccountId = formData.get('socialAccountId') as string

        if (!socialAccountId) {
          return Response.json({ error: 'Missing socialAccountId' }, { status: 400 })
        }

        // Verify ownership and delete
        const deleted = await prisma.socialAccount.deleteMany({
          where: {
            id: socialAccountId,
            userId: session.user.id,
          },
        })

        if (deleted.count === 0) {
          return Response.json({ error: 'Social account not found' }, { status: 404 })
        }

        return Response.json({ success: true })
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Social API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
