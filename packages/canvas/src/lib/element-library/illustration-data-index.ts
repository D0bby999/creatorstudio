/**
 * Illustration library index — types, categories, and aggregation
 */

import { PEOPLE_ILLUSTRATIONS } from './illustration-data-people'
import { TECHNOLOGY_ILLUSTRATIONS } from './illustration-data-technology'
import { BUSINESS_ILLUSTRATIONS } from './illustration-data-business'
import { MISC_ILLUSTRATIONS } from './illustration-data-misc'

export interface IllustrationPath {
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export interface IllustrationDefinition {
  id: string
  label: string
  category: IllustrationCategory
  paths: IllustrationPath[]
  viewBox: string
  tags: string[]
}

export type IllustrationCategory = 'people' | 'technology' | 'business' | 'nature' | 'education' | 'abstract'

export const ILLUSTRATION_CATEGORIES: { id: IllustrationCategory; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'nature', label: 'Nature' },
  { id: 'education', label: 'Education' },
  { id: 'abstract', label: 'Abstract' },
]

const ALL_ILLUSTRATIONS: IllustrationDefinition[] = [
  ...PEOPLE_ILLUSTRATIONS,
  ...TECHNOLOGY_ILLUSTRATIONS,
  ...BUSINESS_ILLUSTRATIONS,
  ...MISC_ILLUSTRATIONS,
]

export function getAllIllustrations(): IllustrationDefinition[] {
  return ALL_ILLUSTRATIONS
}

export function getIllustrationsByCategory(category: IllustrationCategory): IllustrationDefinition[] {
  return getAllIllustrations().filter(i => i.category === category)
}

export function searchIllustrations(query: string): IllustrationDefinition[] {
  const q = query.toLowerCase().trim()
  if (!q) return getAllIllustrations()
  return getAllIllustrations().filter(i =>
    i.label.toLowerCase().includes(q) ||
    i.tags.some(t => t.toLowerCase().includes(q))
  )
}
