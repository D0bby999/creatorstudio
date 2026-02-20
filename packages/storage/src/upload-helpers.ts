import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getBucketName, getPublicUrl } from './storage-client';
import type { PresignedUrlResult, StorageFile } from './storage-types';

const VALID_STORAGE_KEY = /^[a-zA-Z0-9\/!_.*'()\-]+$/;

function validateStorageKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new Error('Storage key must be a non-empty string');
  }
  if (key.length > 512) {
    throw new Error('Storage key exceeds maximum length of 512 characters');
  }
  if (!VALID_STORAGE_KEY.test(key)) {
    throw new Error('Storage key contains invalid characters');
  }
  if (key.includes('..') || key.startsWith('/')) {
    throw new Error('Storage key contains forbidden path patterns');
  }
}

/**
 * Generate presigned URL for client-side upload
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900 // 15 minutes
): Promise<PresignedUrlResult | null> {
  validateStorageKey(key);
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    uploadUrl,
    key,
    expiresAt,
  };
}

/**
 * Generate presigned URL for client-side download
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string | null> {
  validateStorageKey(key);
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload file directly from server
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<void> {
  validateStorageKey(key);
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  validateStorageKey(key);
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if file exists and get metadata
 */
export async function getFileMetadata(
  key: string
): Promise<{ size: number; contentType: string } | null> {
  validateStorageKey(key);
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    return {
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? 'application/octet-stream',
    };
  } catch (error) {
    // File doesn't exist
    return null;
  }
}

/**
 * List files with prefix
 */
export async function listFiles(prefix: string): Promise<StorageFile[]> {
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error('R2 client not configured');
  }

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);
  const contents = response.Contents ?? [];

  return contents.map((item) => ({
    key: item.Key ?? '',
    filename: item.Key?.split('/').pop() ?? '',
    mimeType: 'application/octet-stream', // R2 doesn't return content type in list
    size: item.Size ?? 0,
    url: getPublicUrl(item.Key ?? '') ?? '',
  }));
}
