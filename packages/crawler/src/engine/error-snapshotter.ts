/**
 * Captures screenshot + HTML on first error occurrence per group
 * Stores snapshots in R2 via packages/storage S3 client
 */

export interface ErrorSnapshot {
  screenshotUrl: string
  htmlUrl: string
}

export class ErrorSnapshotter {
  private bucket: string
  private publicDomain: string
  private s3Client: any = null
  private s3Module: any = null

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME ?? 'crawler-errors'
    this.publicDomain =
      process.env.R2_PUBLIC_DOMAIN ?? 'https://errors.example.com'
  }

  async capture(
    page: any,
    url: string,
    errorMessage: string
  ): Promise<ErrorSnapshot | null> {
    try {
      const timestamp = Date.now()
      const urlHash = this.hashUrl(url)
      const screenshotKey = `errors/${urlHash}-${timestamp}.png`
      const htmlKey = `errors/${urlHash}-${timestamp}.html`

      // Capture screenshot (async, 2s timeout)
      const screenshot = await Promise.race([
        page.screenshot({ fullPage: true }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('screenshot timeout')), 2000)
        ),
      ])

      if (!screenshot) return null

      // Capture HTML
      const html = await page.content()
      const htmlWithMeta = `<!-- Error: ${this.sanitize(errorMessage)} -->\n<!-- URL: ${this.sanitize(url)} -->\n<!-- Timestamp: ${new Date().toISOString()} -->\n${html}`

      // Upload to R2 (fire-and-forget for speed)
      await this.uploadToR2(screenshotKey, screenshot as Buffer, 'image/png')
      await this.uploadToR2(htmlKey, Buffer.from(htmlWithMeta), 'text/html')

      return {
        screenshotUrl: `${this.publicDomain}/${screenshotKey}`,
        htmlUrl: `${this.publicDomain}/${htmlKey}`,
      }
    } catch {
      return null
    }
  }

  private async uploadToR2(
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<void> {
    try {
      if (!this.s3Module) {
        const moduleName = '@aws-sdk/client-s3'
        this.s3Module = await import(moduleName).catch(() => null)
        if (!this.s3Module) return
      }

      if (!this.s3Client) {
        this.s3Client = new this.s3Module.S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT ?? '',
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
          },
        })
      }

      await this.s3Client.send(
        new this.s3Module.PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      )
    } catch (err) {
      console.error('[ErrorSnapshotter] R2 upload failed:', err)
    }
  }

  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  private sanitize(str: string): string {
    return str.replace(/-->/g, '--&gt;').replace(/</g, '&lt;')
  }
}
