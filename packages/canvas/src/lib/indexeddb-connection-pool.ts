const MAX_POOL_SIZE = 3
const IDLE_TIMEOUT_MS = 30_000

interface PoolEntry {
  db: IDBDatabase
  idleTimer: ReturnType<typeof setTimeout> | null
}

class IndexedDBPool {
  private pool: PoolEntry[] = []
  private dbName: string
  private dbVersion: number
  private onUpgrade: (db: IDBDatabase) => void

  constructor(
    dbName: string,
    dbVersion: number,
    onUpgrade: (db: IDBDatabase) => void,
  ) {
    this.dbName = dbName
    this.dbVersion = dbVersion
    this.onUpgrade = onUpgrade
  }

  async acquire(): Promise<IDBDatabase> {
    const entry = this.pool.pop()
    if (entry) {
      if (entry.idleTimer) clearTimeout(entry.idleTimer)
      return entry.db
    }
    return this.openNew()
  }

  release(db: IDBDatabase): void {
    if (this.pool.length >= MAX_POOL_SIZE) {
      db.close()
      return
    }

    const idleTimer = setTimeout(() => {
      const idx = this.pool.findIndex((e) => e.db === db)
      if (idx !== -1) {
        this.pool.splice(idx, 1)
        db.close()
      }
    }, IDLE_TIMEOUT_MS)

    this.pool.push({ db, idleTimer })
  }

  destroy(): void {
    for (const entry of this.pool) {
      if (entry.idleTimer) clearTimeout(entry.idleTimer)
      entry.db.close()
    }
    this.pool = []
  }

  get size(): number {
    return this.pool.length
  }

  private openNew(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      request.onupgradeneeded = () => this.onUpgrade(request.result)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error(`IndexedDB "${this.dbName}" blocked by another connection`))
    })
  }
}

export { IndexedDBPool }
