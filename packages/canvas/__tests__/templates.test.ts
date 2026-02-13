import { describe, it, expect } from 'vitest'
import { canvasTemplates, getTemplatesByCategory } from '../src/templates/canvas-templates'

describe('Canvas Templates', () => {
  it('has 17 entries (10+7)', () => {
    expect(canvasTemplates).toHaveLength(17)
  })

  it('all templates have positive width/height', () => {
    for (const template of canvasTemplates) {
      expect(template.width).toBeGreaterThan(0)
      expect(template.height).toBeGreaterThan(0)
    }
  })

  it('no duplicate IDs', () => {
    const ids = canvasTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('getTemplatesByCategory includes LinkedIn category', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped['LinkedIn']).toBeDefined()
    expect(grouped['LinkedIn'].length).toBeGreaterThan(0)
  })

  it('getTemplatesByCategory includes Pinterest category', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped['Pinterest']).toBeDefined()
    expect(grouped['Pinterest'].length).toBeGreaterThan(0)
  })

  it('LinkedIn category has 3 templates', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped['LinkedIn'].length).toBe(3)
    const ids = grouped['LinkedIn'].map((t) => t.id)
    expect(ids).toContain('li-post')
    expect(ids).toContain('li-banner')
    expect(ids).toContain('li-article')
  })

  it('Pinterest category has 2 templates', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped['Pinterest'].length).toBe(2)
    const ids = grouped['Pinterest'].map((t) => t.id)
    expect(ids).toContain('pin-standard')
    expect(ids).toContain('pin-square')
  })

  it('Facebook category has 3 templates', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped['Facebook'].length).toBe(3)
    const ids = grouped['Facebook'].map((t) => t.id)
    expect(ids).toContain('fb-post')
    expect(ids).toContain('fb-cover')
    expect(ids).toContain('fb-story')
  })
})
