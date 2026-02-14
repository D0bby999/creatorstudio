import type { ActionFunctionArgs } from 'react-router';
import { requireSession } from '~/lib/auth-server';
import { prisma } from '@creator-studio/db/client';
import {
  getFileMetadata,
  getPublicUrl,
  extractUserIdFromKey,
} from '@creator-studio/storage';

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);

  try {
    const body = await request.json();
    const { key, filename, type, projectId } = body;

    if (!key || !filename || !type) {
      return Response.json(
        { error: 'Missing required fields: key, filename, type' },
        { status: 400 }
      );
    }

    // Verify key belongs to current user
    const keyUserId = extractUserIdFromKey(key);
    if (keyUserId !== session.user.id) {
      return Response.json(
        { error: 'Key does not belong to current user' },
        { status: 403 }
      );
    }

    // Verify file exists in R2
    const metadata = await getFileMetadata(key);
    if (!metadata) {
      return Response.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }

    // Get public URL
    const url = getPublicUrl(key);
    if (!url) {
      return Response.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      );
    }

    // Create MediaFile record
    const mediaFile = await prisma.mediaFile.create({
      data: {
        key,
        filename,
        contentType: metadata.contentType,
        size: metadata.size,
        url,
        type,
        userId: session.user.id,
        projectId: projectId || null,
      },
    });

    return Response.json({
      id: mediaFile.id,
      key: mediaFile.key,
      url: mediaFile.url,
      filename: mediaFile.filename,
      contentType: mediaFile.contentType,
      size: mediaFile.size,
      type: mediaFile.type,
      createdAt: mediaFile.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Upload confirmation error:', error);
    return Response.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}
