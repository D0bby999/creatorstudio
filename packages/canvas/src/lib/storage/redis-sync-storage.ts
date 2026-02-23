// Redis-backed storage for canvas room state with Pub/Sub cross-instance sync
// Uses ioredis (TCP) for native Pub/Sub. Falls back to in-memory when unavailable.

import Redis from 'ioredis'
import { gzip, gunzip } from 'node:zlib'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

const ROOM_TTL_SECONDS = 86400 // 24h
const REDIS_KEY_PREFIX = 'canvas:room'

export interface SyncStorageRecord {
  [key: string]: unknown
}

export interface RedisSyncStorageOptions {
  redisUrl: string
  roomId: string
  instanceId?: string
  onRemoteUpdate?: (recordId: string, data: unknown, type: 'put' | 'delete') => void
}

export class RedisSyncStorage {
  private redis: Redis
  private subscriber: Redis
  private roomId: string
  private instanceId: string
  private channel: string
  private closed = false

  constructor(private options: RedisSyncStorageOptions) {
    this.redis = new Redis(options.redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })
    this.subscriber = new Redis(options.redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })
    this.roomId = options.roomId
    this.instanceId = options.instanceId ?? `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this.channel = `${REDIS_KEY_PREFIX}:${this.roomId}:updates`
  }

  async connect(): Promise<void> {
    await this.redis.connect()
    await this.subscriber.connect()
    await this.subscriber.subscribe(this.channel)

    this.subscriber.on('message', (_channel: string, message: string) => {
      if (this.closed) return
      try {
        const parsed = JSON.parse(message)
        // Skip own messages
        if (parsed.instanceId === this.instanceId) return
        this.options.onRemoteUpdate?.(parsed.recordId, parsed.data, parsed.type)
      } catch { /* ignore malformed */ }
    })
  }

  private stateKey(): string {
    return `${REDIS_KEY_PREFIX}:${this.roomId}:state`
  }

  async get(recordId: string): Promise<unknown | null> {
    const compressed = await this.redis.hgetBuffer(this.stateKey(), recordId)
    if (!compressed) return null
    const json = await gunzipAsync(compressed)
    return JSON.parse(json.toString())
  }

  async getAll(): Promise<Record<string, unknown>> {
    const allRaw = await this.redis.hgetallBuffer(this.stateKey())
    if (!allRaw || Object.keys(allRaw).length === 0) return {}

    const result: Record<string, unknown> = {}
    for (const [key, compressed] of Object.entries(allRaw)) {
      try {
        const json = await gunzipAsync(compressed as Buffer)
        result[key] = JSON.parse(json.toString())
      } catch { /* skip corrupted */ }
    }
    return result
  }

  async put(recordId: string, record: unknown): Promise<void> {
    const json = JSON.stringify(record)
    const compressed = await gzipAsync(json)
    await this.redis.hset(this.stateKey(), recordId, compressed)
    await this.redis.expire(this.stateKey(), ROOM_TTL_SECONDS)

    await this.redis.publish(this.channel, JSON.stringify({
      type: 'put',
      recordId,
      data: record,
      instanceId: this.instanceId,
    })).catch(() => {}) // Non-blocking
  }

  async putBatch(records: Record<string, unknown>): Promise<void> {
    const pipeline = this.redis.pipeline()
    for (const [recordId, record] of Object.entries(records)) {
      const json = JSON.stringify(record)
      const compressed = await gzipAsync(json)
      pipeline.hset(this.stateKey(), recordId, compressed)
    }
    pipeline.expire(this.stateKey(), ROOM_TTL_SECONDS)
    await pipeline.exec()
  }

  async delete(recordId: string): Promise<void> {
    await this.redis.hdel(this.stateKey(), recordId)
    await this.redis.publish(this.channel, JSON.stringify({
      type: 'delete',
      recordId,
      instanceId: this.instanceId,
    })).catch(() => {})
  }

  async close(): Promise<void> {
    this.closed = true
    await this.subscriber.unsubscribe(this.channel).catch(() => {})
    await this.subscriber.quit().catch(() => {})
    await this.redis.quit().catch(() => {})
  }
}

// Factory with fallback
let ioredisAvailable: boolean | null = null

export async function createRedisSyncStorage(
  roomId: string,
  onRemoteUpdate?: RedisSyncStorageOptions['onRemoteUpdate']
): Promise<RedisSyncStorage | null> {
  const redisUrl = process.env.CANVAS_REDIS_URL ?? process.env.REDIS_URL
  if (!redisUrl) {
    if (ioredisAvailable === null) {
      ioredisAvailable = false
      console.warn('[redis-sync-storage] CANVAS_REDIS_URL/REDIS_URL not set — using in-memory fallback')
    }
    return null
  }

  try {
    const storage = new RedisSyncStorage({ redisUrl, roomId, onRemoteUpdate })
    await storage.connect()
    ioredisAvailable = true
    return storage
  } catch (err) {
    console.error('[redis-sync-storage] Failed to connect:', err)
    ioredisAvailable = false
    return null
  }
}

export function isIoRedisAvailable(): boolean {
  return ioredisAvailable === true
}
