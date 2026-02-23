import type { CanvasTemplate } from './canvas-templates'
import { extractTemplateTags, mapPlatformToCategory, type TemplateCategory } from './canvas-template-categories'

export interface SearchOptions {
  query?: string
  category?: TemplateCategory
  sortBy?: 'relevance' | 'name' | 'recent'
}

export interface TemplateWithMetadata extends CanvasTemplate {
  tags: string[]
  templateCategory: TemplateCategory
  relevanceScore?: number
}

/** Add metadata to templates for search/filtering */
export function enrichTemplates(templates: CanvasTemplate[]): TemplateWithMetadata[] {
  return templates.map((t) => ({
    ...t,
    tags: extractTemplateTags(t),
    templateCategory: mapPlatformToCategory(t.category),
  }))
}

/** Search templates by query string (fuzzy includes-based matching) */
export function searchTemplates(
  templates: TemplateWithMetadata[],
  options: SearchOptions = {}
): TemplateWithMetadata[] {
  const { query, category, sortBy = 'relevance' } = options

  let results = [...templates]

  // Filter by category
  if (category && category !== 'blank') {
    results = results.filter((t) => t.templateCategory === category)
  }

  // Filter by search query
  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase().trim()
    results = results
      .map((t) => {
        const nameMatch = t.name.toLowerCase().includes(lowerQuery)
        const descMatch = t.description.toLowerCase().includes(lowerQuery)
        const categoryMatch = t.category.toLowerCase().includes(lowerQuery)
        const tagMatch = t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))

        // Calculate relevance score
        let score = 0
        if (nameMatch) score += 10
        if (descMatch) score += 5
        if (categoryMatch) score += 3
        if (tagMatch) score += 2

        return { ...t, relevanceScore: score }
      })
      .filter((t) => (t.relevanceScore ?? 0) > 0)
  }

  // Sort results
  if (sortBy === 'relevance' && query) {
    results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
  } else if (sortBy === 'name') {
    results.sort((a, b) => a.name.localeCompare(b.name))
  }

  return results
}

/** Filter templates by multiple tags (AND logic) */
export function filterByTags(templates: TemplateWithMetadata[], tags: string[]): TemplateWithMetadata[] {
  if (!tags.length) return templates
  return templates.filter((t) => tags.every((tag) => t.tags.includes(tag as any)))
}

/** Get unique tags from template collection */
export function getUniqueTags(templates: TemplateWithMetadata[]): string[] {
  const tagSet = new Set<string>()
  for (const template of templates) {
    for (const tag of template.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

/** Group templates by their template category */
export function groupByTemplateCategory(
  templates: TemplateWithMetadata[]
): Record<TemplateCategory, TemplateWithMetadata[]> {
  const grouped: Record<string, TemplateWithMetadata[]> = {
    'social-media': [],
    marketing: [],
    presentation: [],
    blank: [],
  }

  for (const template of templates) {
    grouped[template.templateCategory].push(template)
  }

  return grouped as Record<TemplateCategory, TemplateWithMetadata[]>
}
