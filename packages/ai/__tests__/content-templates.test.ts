import { describe, it, expect } from 'vitest'
import {
  CONTENT_TEMPLATES,
  getContentTemplate,
  getTemplatesByPlatform,
  fillTemplate,
} from '../src/lib/content-template-system'

describe('content-template-system', () => {
  describe('getContentTemplate', () => {
    it('should return template for instagram caption', () => {
      const result = getContentTemplate('instagram', 'caption')

      expect(result).toBeDefined()
      expect(result?.id).toBe('instagram-caption')
      expect(result?.platform).toBe('instagram')
      expect(result?.type).toBe('caption')
    })

    it('should return undefined for unknown platform/type', () => {
      const result = getContentTemplate('unknown', 'x')

      expect(result).toBeUndefined()
    })
  })

  describe('getTemplatesByPlatform', () => {
    it('should return twitter templates', () => {
      const result = getTemplatesByPlatform('twitter')

      expect(result).toHaveLength(1)
      expect(result[0].platform).toBe('twitter')
      expect(result[0].type).toBe('thread')
    })

    it('should return empty array for platform with no templates', () => {
      const result = getTemplatesByPlatform('nonexistent')

      expect(result).toHaveLength(0)
    })
  })

  describe('fillTemplate', () => {
    it('should replace {{var}} placeholders', () => {
      const template = 'Hello {{name}}, welcome to {{platform}}!'
      const vars = { name: 'Alice', platform: 'Instagram' }

      const result = fillTemplate(template, vars)

      expect(result).toBe('Hello Alice, welcome to Instagram!')
    })

    it('should return original with no matching vars', () => {
      const template = 'No placeholders here'
      const vars = { name: 'Alice' }

      const result = fillTemplate(template, vars)

      expect(result).toBe('No placeholders here')
    })

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} is great. {{name}} rocks!'
      const vars = { name: 'Bob' }

      const result = fillTemplate(template, vars)

      expect(result).toBe('Bob is great. Bob rocks!')
    })
  })

  describe('CONTENT_TEMPLATES', () => {
    it('should have 4 entries', () => {
      expect(CONTENT_TEMPLATES).toHaveLength(4)
    })

    it('should have unique IDs', () => {
      const ids = CONTENT_TEMPLATES.map(t => t.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have valid maxLength values', () => {
      for (const template of CONTENT_TEMPLATES) {
        expect(template.maxLength).toBeGreaterThan(0)
      }
    })
  })
})
