import { EventEmitter } from 'node:events'
import type {
  CrawlRequest,
  CrawlResult,
  CrawlRunResult,
  CrawlerEvent,
} from '../types/crawler-types.js'

/**
 * Type-safe event map for crawler lifecycle events
 */
interface CrawlerEventMap {
  requestStarted: [request: CrawlRequest]
  requestCompleted: [result: CrawlResult]
  requestFailed: [request: CrawlRequest, error: Error]
  crawlFinished: [result: CrawlRunResult]
}

/**
 * Type-safe EventEmitter wrapper for crawler lifecycle events
 */
export class CrawlerEventEmitter {
  private emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
  }

  /**
   * Register event listener
   */
  on<K extends CrawlerEvent>(
    event: K,
    listener: (...args: CrawlerEventMap[K]) => void
  ): this {
    this.emitter.on(event, listener)
    return this
  }

  /**
   * Unregister event listener
   */
  off<K extends CrawlerEvent>(
    event: K,
    listener: (...args: CrawlerEventMap[K]) => void
  ): this {
    this.emitter.off(event, listener)
    return this
  }

  /**
   * Emit event with type-safe arguments
   */
  emit<K extends CrawlerEvent>(event: K, ...args: CrawlerEventMap[K]): boolean {
    return this.emitter.emit(event, ...args)
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: CrawlerEvent): this {
    this.emitter.removeAllListeners(event)
    return this
  }
}
