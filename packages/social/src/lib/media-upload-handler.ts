// Media upload handler for Cloudinary integration
// Handles image/video uploads, deletions, and URL optimization

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1'

export interface UploadResult {
  url: string
  publicId: string
}

export async function uploadMedia(
  file: Buffer,
  filename: string,
  cloudName: string,
  uploadPreset: string
): Promise<UploadResult> {
  if (file.length === 0) {
    throw new Error('File is empty')
  }

  const formData = new FormData()
  formData.append('file', new Blob([file]), filename)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(
    `${CLOUDINARY_UPLOAD_URL}/${cloudName}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Cloudinary upload error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

export async function deleteMedia(
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000)
  const response = await fetch(
    `${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/destroy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_id: publicId,
        api_key: apiKey,
        timestamp,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary delete error: ${response.status}`)
  }
}

export function getOptimizedUrl(
  publicId: string,
  cloudName: string,
  options?: { width?: number; format?: string }
): string {
  const transforms: string[] = []
  if (options?.width) transforms.push(`w_${options.width}`)
  if (options?.format) transforms.push(`f_${options.format}`)
  const transformStr = transforms.length > 0 ? transforms.join(',') + '/' : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}${publicId}`
}
