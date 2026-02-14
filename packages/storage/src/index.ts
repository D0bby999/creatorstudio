// Client and configuration
export {
  getR2Client,
  getR2Config,
  getBucketName,
  getPublicUrl,
} from './storage-client';

// Upload and file operations
export {
  getSignedUploadUrl,
  getSignedDownloadUrl,
  uploadFile,
  deleteFile,
  getFileMetadata,
  listFiles,
} from './upload-helpers';

// Path helpers
export {
  generateMediaPath,
  sanitizeFilename,
  extractUserIdFromKey,
  extractFileTypeFromKey,
} from './media-path-helpers';

// Types
export type {
  FileType,
  StorageFile,
  UploadConfig,
  PresignedUrlResult,
} from './storage-types';
export { UPLOAD_CONFIGS } from './storage-types';
