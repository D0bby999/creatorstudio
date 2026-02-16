import type { CrawlDataset, DatasetItem, ScrapedContent } from '../types/crawler-types.js'

/**
 * Simple string hash function for content hashing
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Compute content hash from scraped content
 */
function computeContentHash(content: ScrapedContent): string {
  const hashInput = JSON.stringify({
    title: content.title,
    description: content.description,
    text: content.text,
  })
  return hashString(hashInput)
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * In-memory dataset manager
 * Handles dataset creation, item storage, search, and retrieval
 */
export class DatasetManager {
  private datasets = new Map<string, CrawlDataset>()

  /**
   * Create a new dataset
   */
  createDataset(userId: string, name: string, jobId?: string): CrawlDataset {
    const dataset: CrawlDataset = {
      id: generateId(),
      name,
      jobId,
      itemCount: 0,
      totalBytes: 0,
      userId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.datasets.set(dataset.id, dataset)
    return dataset
  }

  /**
   * Add items to dataset
   * @returns Number of items added
   */
  addItems(datasetId: string, items: ScrapedContent[]): number {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`)
    }

    let addedCount = 0

    items.forEach(content => {
      const contentHash = computeContentHash(content)
      const item: DatasetItem = {
        id: generateId(),
        datasetId,
        url: content.url,
        data: content,
        contentHash,
        createdAt: new Date().toISOString(),
      }

      dataset.items.push(item)
      dataset.totalBytes += JSON.stringify(content).length
      addedCount++
    })

    dataset.itemCount = dataset.items.length
    dataset.updatedAt = new Date().toISOString()

    return addedCount
  }

  /**
   * Get dataset by ID
   */
  getDataset(datasetId: string): CrawlDataset | null {
    return this.datasets.get(datasetId) || null
  }

  /**
   * List all datasets for a user
   */
  listDatasets(userId: string): CrawlDataset[] {
    return Array.from(this.datasets.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /**
   * Delete dataset
   * @returns true if deleted, false if not found
   */
  deleteDataset(datasetId: string): boolean {
    return this.datasets.delete(datasetId)
  }

  /**
   * Get paginated items from dataset
   */
  getItems(datasetId: string, page = 1, pageSize = 50): DatasetItem[] {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`)
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return dataset.items.slice(start, end)
  }

  /**
   * Search items by URL or data content
   */
  searchItems(datasetId: string, query: string): DatasetItem[] {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`)
    }

    const lowerQuery = query.toLowerCase()

    return dataset.items.filter(item => {
      return (
        item.url.toLowerCase().includes(lowerQuery) ||
        item.data.title.toLowerCase().includes(lowerQuery) ||
        item.data.description.toLowerCase().includes(lowerQuery) ||
        item.data.text.toLowerCase().includes(lowerQuery)
      )
    })
  }
}
