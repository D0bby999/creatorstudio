import { IndexedDBPool } from './indexeddb-connection-pool'

const DB_NAME = 'creator-studio-canvas-versions'
const STORE_NAME = 'versions'
const DB_VERSION = 1
const MAX_VERSIONS = 50

export interface VersionEntry {
  projectId: string
  timestamp: number
  label?: string
  shapeCount: number
  snapshot: any
}

const pool = new IndexedDBPool(DB_NAME, DB_VERSION, (db) => {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: ['projectId', 'timestamp'] })
    store.createIndex('byProject', 'projectId', { unique: false })
  }
})

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await pool.acquire()
  try {
    return await fn(db)
  } finally {
    pool.release(db)
  }
}

export async function saveVersion(projectId: string, snapshot: any, label?: string): Promise<void> {
  return withDb(async (db) => {
    const shapeCount = Object.keys(snapshot?.store ?? {}).length
    const entry: VersionEntry = {
      projectId,
      timestamp: Date.now(),
      label,
      shapeCount,
      snapshot,
    }

    return new Promise((resolve, reject) => {
      const store = tx(db, 'readwrite')
      const req = store.add(entry)
      req.onsuccess = () => { resolve(); pruneVersions(projectId).catch(() => {}) }
      req.onerror = () => reject(req.error)
    })
  })
}

export async function getVersions(projectId: string): Promise<Omit<VersionEntry, 'snapshot'>[]> {
  return withDb(async (db) => {
    return new Promise((resolve, reject) => {
      const store = tx(db, 'readonly')
      const index = store.index('byProject')
      const req = index.getAll(projectId)
      req.onsuccess = () => {
        const results = (req.result as VersionEntry[])
          .map(({ snapshot: _s, ...rest }) => rest)
          .sort((a, b) => b.timestamp - a.timestamp)
        resolve(results)
      }
      req.onerror = () => reject(req.error)
    })
  })
}

export async function getVersion(projectId: string, timestamp: number): Promise<VersionEntry | null> {
  return withDb(async (db) => {
    return new Promise((resolve, reject) => {
      const store = tx(db, 'readonly')
      const req = store.get([projectId, timestamp])
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function restoreVersion(editor: any, projectId: string, timestamp: number): Promise<boolean> {
  const version = await getVersion(projectId, timestamp)
  if (!version) return false
  editor.store.loadSnapshot(version.snapshot)
  return true
}

export async function deleteVersion(projectId: string, timestamp: number): Promise<void> {
  return withDb(async (db) => {
    return new Promise((resolve, reject) => {
      const store = tx(db, 'readwrite')
      const req = store.delete([projectId, timestamp])
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  })
}

async function pruneVersions(projectId: string): Promise<void> {
  return withDb(async (db) => {
    return new Promise((resolve) => {
      const store = tx(db, 'readwrite')
      const index = store.index('byProject')
      const req = index.getAll(projectId)
      req.onsuccess = () => {
        const all = (req.result as VersionEntry[]).sort((a, b) => b.timestamp - a.timestamp)
        if (all.length <= MAX_VERSIONS) { resolve(); return }
        const toDelete = all.slice(MAX_VERSIONS)
        const delStore = tx(db, 'readwrite')
        let remaining = toDelete.length
        for (const entry of toDelete) {
          const delReq = delStore.delete([entry.projectId, entry.timestamp])
          delReq.onsuccess = delReq.onerror = () => { if (--remaining === 0) resolve() }
        }
      }
      req.onerror = () => resolve()
    })
  })
}

export function destroyVersionPool(): void {
  pool.destroy()
}
