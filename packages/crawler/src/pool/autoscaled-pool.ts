import { ResourceMonitor } from './resource-monitor.js'
import { Snapshotter } from './snapshotter.js'

/**
 * Configuration for AutoscaledPool
 */
export interface AutoscaledPoolConfig {
  minConcurrency?: number
  maxConcurrency?: number
  desiredConcurrencyRatio?: number
  scaleUpStepRatio?: number
  scaleDownStepRatio?: number
  scaleIntervalMs?: number
  taskFn: () => Promise<void>
  isTaskReadyFn?: () => Promise<boolean>
  isFinishedFn?: () => Promise<boolean>
}

/**
 * Concurrency manager with resource-aware auto-scaling
 * Dynamically adjusts worker count based on system resources
 */
export class AutoscaledPool {
  private config: Required<AutoscaledPoolConfig>
  private resourceMonitor: ResourceMonitor
  private snapshotter: Snapshotter
  private _desiredConcurrency = 1
  private _isRunning = false
  private isPaused = false
  private inFlightTasks = new Set<Promise<void>>()
  private scaleIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(config: AutoscaledPoolConfig) {
    this.config = {
      minConcurrency: config.minConcurrency ?? 1,
      maxConcurrency: config.maxConcurrency ?? 10,
      desiredConcurrencyRatio: config.desiredConcurrencyRatio ?? 0.9,
      scaleUpStepRatio: config.scaleUpStepRatio ?? 0.05,
      scaleDownStepRatio: config.scaleDownStepRatio ?? 0.05,
      scaleIntervalMs: config.scaleIntervalMs ?? 500,
      taskFn: config.taskFn,
      isTaskReadyFn: config.isTaskReadyFn ?? (async () => true),
      isFinishedFn: config.isFinishedFn ?? (async () => false),
    }

    this.resourceMonitor = new ResourceMonitor()
    this.snapshotter = new Snapshotter()
    this._desiredConcurrency = this.config.minConcurrency
  }

  /**
   * Start the pool and run until finished
   */
  async run(): Promise<void> {
    if (this._isRunning) {
      throw new Error('Pool is already running')
    }

    this._isRunning = true
    this.resourceMonitor.start()
    this.snapshotter.start()

    // Start scaling interval
    this.scaleIntervalId = setInterval(() => {
      this.adjustConcurrency()
    }, this.config.scaleIntervalMs)

    // Main worker spawn loop
    while (this._isRunning) {
      // Check if finished
      if (await this.config.isFinishedFn()) {
        if (this.inFlightTasks.size === 0) {
          break
        }
      }

      // Spawn new workers if needed
      if (
        !this.isPaused &&
        this.currentConcurrency < this._desiredConcurrency &&
        (await this.config.isTaskReadyFn())
      ) {
        this.spawnTask()
      }

      // Small delay to prevent tight loop
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // Wait for all in-flight tasks
    await this.waitForInFlight()

    // Cleanup
    this.resourceMonitor.stop()
    this.snapshotter.stop()
    if (this.scaleIntervalId) {
      clearInterval(this.scaleIntervalId)
      this.scaleIntervalId = null
    }
  }

  /**
   * Gracefully stop the pool - wait for in-flight tasks
   */
  async stop(): Promise<void> {
    this._isRunning = false
    await this.waitForInFlight()
  }

  /**
   * Pause spawning new tasks
   */
  async pause(): Promise<void> {
    this.isPaused = true
  }

  /**
   * Resume spawning new tasks
   */
  async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Get current concurrency level
   */
  get currentConcurrency(): number {
    return this.inFlightTasks.size
  }

  /**
   * Get desired concurrency level
   */
  get desiredConcurrency(): number {
    return this._desiredConcurrency
  }

  /**
   * Check if pool is running
   */
  get isRunning(): boolean {
    return this._isRunning
  }

  /**
   * Spawn a new task worker
   */
  private spawnTask(): void {
    const taskPromise = this.config
      .taskFn()
      .catch((error) => {
        // Errors are handled by task function itself
        console.error('Task error:', error)
      })
      .finally(() => {
        this.inFlightTasks.delete(taskPromise)
      })

    this.inFlightTasks.add(taskPromise)
  }

  /**
   * Adjust desired concurrency based on resource monitor
   */
  private adjustConcurrency(): void {
    const memoryOverloaded = this.resourceMonitor.isOverloaded()
    const eventLoopOverloaded = this.snapshotter.isEventLoopOverloaded()

    if (memoryOverloaded || eventLoopOverloaded) {
      const decrease = Math.ceil(this._desiredConcurrency * this.config.scaleDownStepRatio)
      this._desiredConcurrency = Math.max(this.config.minConcurrency, this._desiredConcurrency - decrease)
    } else if (!this.snapshotter.isEventLoopOverloaded(5000, 0.1)) {
      // Scale up only when event loop is clearly under-utilized
      const increase = Math.ceil(this._desiredConcurrency * this.config.scaleUpStepRatio)
      this._desiredConcurrency = Math.min(this.config.maxConcurrency, this._desiredConcurrency + increase)
    }
  }

  /**
   * Wait for all in-flight tasks to complete
   */
  private async waitForInFlight(): Promise<void> {
    while (this.inFlightTasks.size > 0) {
      await Promise.race(this.inFlightTasks)
    }
  }
}
