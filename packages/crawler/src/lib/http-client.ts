/**
 * HTTP client wrapper using got-scraping for HTTP/2 + TLS fingerprinting
 * Replaces native fetch for anti-detection scraping
 */

import { gotScraping } from 'got-scraping'

export interface HttpClientOptions {
  headers?: Record<string, string>
  timeout?: number
  followRedirect?: boolean
  proxyUrl?: string
}

export interface HttpResponse {
  body: string
  statusCode: number
  headers: Record<string, string>
  url: string
}

export class HttpClient {
  private defaultTimeout: number

  constructor(defaultTimeout = 30000) {
    this.defaultTimeout = defaultTimeout
  }

  async get(url: string, options: HttpClientOptions = {}): Promise<HttpResponse> {
    const response = await gotScraping({
      url,
      method: 'GET',
      headers: options.headers ?? {},
      timeout: { request: options.timeout ?? this.defaultTimeout },
      followRedirect: options.followRedirect ?? true,
      retry: { limit: 0 },
      proxyUrl: options.proxyUrl,
    })

    const responseHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === 'string') {
        responseHeaders[key] = value
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(', ')
      }
    }

    return {
      body: response.body,
      statusCode: response.statusCode,
      headers: responseHeaders,
      url: response.url,
    }
  }

  async post(
    url: string,
    body: string,
    options: HttpClientOptions = {}
  ): Promise<HttpResponse> {
    const response = await gotScraping({
      url,
      method: 'POST',
      body,
      headers: options.headers ?? {},
      timeout: { request: options.timeout ?? this.defaultTimeout },
      followRedirect: options.followRedirect ?? true,
      retry: { limit: 0 },
      proxyUrl: options.proxyUrl,
    })

    const responseHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === 'string') {
        responseHeaders[key] = value
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(', ')
      }
    }

    return {
      body: response.body,
      statusCode: response.statusCode,
      headers: responseHeaders,
      url: response.url,
    }
  }
}
