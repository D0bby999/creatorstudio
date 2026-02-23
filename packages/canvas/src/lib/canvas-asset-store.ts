import type { TLAssetStore } from 'tldraw'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

/** Create asset store backed by R2 presigned upload flow */
export function createCanvasAssetStore(uploadEndpoint: string): TLAssetStore {
  return {
    async upload(_asset, file) {
      validateFile(file)

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })

      if (!res.ok) {
        throw new Error(`Upload request failed: ${res.status}`)
      }

      const { uploadUrl, publicUrl } = await res.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        throw new Error(`R2 upload failed: ${uploadRes.status}`)
      }

      return { src: publicUrl }
    },

    resolve(asset) {
      return asset.props.src ?? ''
    },
  }
}

/** Create fallback asset store using data URLs (no R2 required) */
export function createFallbackAssetStore(): TLAssetStore {
  return {
    async upload(_asset, file) {
      validateFile(file)
      const src = await fileToDataUrl(file)
      return { src }
    },

    resolve(asset) {
      return asset.props.src ?? ''
    },
  }
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
