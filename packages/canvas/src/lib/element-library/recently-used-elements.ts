const STORAGE_KEY = 'canvas-recent-elements'
const MAX_RECENT = 20

export interface RecentElement {
  type: 'photo' | 'icon' | 'shape'
  id: string
  preview: string
  label: string
  addedAt: number
}

export function addRecentElement(
  element: Omit<RecentElement, 'addedAt'>
): void {
  const recent = getRecentElements()
  const newElement: RecentElement = { ...element, addedAt: Date.now() }

  // Remove duplicates
  const filtered = recent.filter(e => e.id !== element.id)

  // Add to front
  filtered.unshift(newElement)

  // Keep only MAX_RECENT
  const trimmed = filtered.slice(0, MAX_RECENT)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.warn('Failed to save recent elements:', e)
  }
}

export function getRecentElements(): RecentElement[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return []
    return JSON.parse(json)
  } catch (e) {
    console.warn('Failed to load recent elements:', e)
    return []
  }
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear recent elements:', e)
  }
}
