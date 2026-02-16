import type { DatasetItem, DatasetDiff } from '../types/crawler-types.js'

/**
 * Compare two datasets and find differences
 * @param oldItems - Previous dataset items
 * @param newItems - New dataset items
 * @returns Diff with added, removed, and changed URLs
 */
export function diffDatasets(
  oldItems: DatasetItem[],
  newItems: DatasetItem[]
): DatasetDiff {
  const oldUrlMap = new Map<string, DatasetItem>()
  const newUrlMap = new Map<string, DatasetItem>()

  // Build lookup maps
  oldItems.forEach(item => oldUrlMap.set(item.url, item))
  newItems.forEach(item => newUrlMap.set(item.url, item))

  const added: string[] = []
  const removed: string[] = []
  const changed: Array<{ url: string; oldHash: string; newHash: string }> = []

  // Find added and changed URLs
  newUrlMap.forEach((newItem, url) => {
    const oldItem = oldUrlMap.get(url)

    if (!oldItem) {
      // New URL not in old dataset
      added.push(url)
    } else if (oldItem.contentHash !== newItem.contentHash) {
      // URL exists but content changed
      changed.push({
        url,
        oldHash: oldItem.contentHash,
        newHash: newItem.contentHash,
      })
    }
  })

  // Find removed URLs
  oldUrlMap.forEach((oldItem, url) => {
    if (!newUrlMap.has(url)) {
      removed.push(url)
    }
  })

  return {
    added: added.sort(),
    removed: removed.sort(),
    changed: changed.sort((a, b) => a.url.localeCompare(b.url)),
  }
}

/**
 * Get summary statistics from diff
 */
export function getDiffStats(diff: DatasetDiff) {
  return {
    totalChanges: diff.added.length + diff.removed.length + diff.changed.length,
    added: diff.added.length,
    removed: diff.removed.length,
    changed: diff.changed.length,
    unchanged: 0, // Computed by caller if needed
  }
}
