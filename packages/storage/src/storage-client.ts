import { S3Client } from '@aws-sdk/client-s3';

let r2Client: S3Client | null = null;

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn(
      'R2 configuration missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
    );
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

export function getR2Client(): S3Client | null {
  if (r2Client) {
    return r2Client;
  }

  const config = getR2Config();
  if (!config) {
    return null;
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

export function getBucketName(): string | null {
  const config = getR2Config();
  return config?.bucketName ?? null;
}

export function getPublicUrl(key: string): string | null {
  const config = getR2Config();
  if (!config) {
    return null;
  }

  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }

  // Default R2 public bucket URL format
  return `https://pub-${config.accountId}.r2.dev/${key}`;
}
