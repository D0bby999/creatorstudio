import type { ActionFunctionArgs } from 'react-router';
import { requireSession } from '~/lib/auth-server';
import {
  getSignedUploadUrl,
  generateMediaPath,
  UPLOAD_CONFIGS,
  type FileType,
} from '@creator-studio/storage';

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);

  try {
    const body = await request.json();
    const { filename, contentType, type } = body;

    if (!filename || !contentType || !type) {
      return Response.json(
        { error: 'Missing required fields: filename, contentType, type' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes: FileType[] = [
      'video-export',
      'canvas-export',
      'social-upload',
      'thumbnail',
    ];
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate content type
    const config = UPLOAD_CONFIGS[type as FileType];
    if (!config.allowedTypes.includes(contentType)) {
      return Response.json(
        {
          error: `Invalid content type for ${type}. Allowed: ${config.allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate media path
    const key = generateMediaPath(session.user.id, type as FileType, filename);

    // Generate presigned URL
    const result = await getSignedUploadUrl(key, contentType, config.ttl);

    if (!result) {
      return Response.json(
        { error: 'R2 storage not configured' },
        { status: 503 }
      );
    }

    return Response.json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return Response.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
