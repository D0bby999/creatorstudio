/** Manage favorite templates using localStorage */

const STORAGE_KEY = 'canvas-template-favorites'

/** Get list of favorite template IDs from localStorage */
export function getFavoriteTemplateIds(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/** Check if template is favorited */
export function isTemplateFavorite(templateId: string): boolean {
  const favorites = getFavoriteTemplateIds()
  return favorites.includes(templateId)
}

/** Add template to favorites */
export function addFavoriteTemplate(templateId: string): void {
  if (typeof window === 'undefined') return

  try {
    const favorites = getFavoriteTemplateIds()
    if (!favorites.includes(templateId)) {
      favorites.push(templateId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    }
  } catch (error) {
    console.error('Failed to add favorite:', error)
  }
}

/** Remove template from favorites */
export function removeFavoriteTemplate(templateId: string): void {
  if (typeof window === 'undefined') return

  try {
    const favorites = getFavoriteTemplateIds()
    const filtered = favorites.filter((id) => id !== templateId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove favorite:', error)
  }
}

/** Toggle template favorite status */
export function toggleFavoriteTemplate(templateId: string): boolean {
  const isFavorite = isTemplateFavorite(templateId)

  if (isFavorite) {
    removeFavoriteTemplate(templateId)
    return false
  } else {
    addFavoriteTemplate(templateId)
    return true
  }
}

/** Clear all favorites */
export function clearFavoriteTemplates(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear favorites:', error)
  }
}

/** Filter templates to only favorites */
export function filterFavoriteTemplates<T extends { id: string }>(templates: T[]): T[] {
  const favorites = getFavoriteTemplateIds()
  return templates.filter((t) => favorites.includes(t.id))
}
