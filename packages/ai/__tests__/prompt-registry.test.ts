import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerPrompt,
  getPrompt,
  listPromptVersions,
  renderPrompt,
  clearRegistry,
  type PromptEntry,
} from '../src/lib/prompt-registry'

describe('prompt-registry', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('registerPrompt and getPrompt', () => {
    it('should register and retrieve prompt by name', () => {
      const entry: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { author: 'test', createdAt: Date.now() },
      }

      registerPrompt(entry)
      const retrieved = getPrompt('greeting')

      expect(retrieved).toEqual(entry)
    })

    it('should return latest version when no version specified', () => {
      const v1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      const v2: PromptEntry = {
        name: 'greeting',
        version: '2.0.0',
        template: 'Hi {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(v1)
      registerPrompt(v2)

      const retrieved = getPrompt('greeting')
      expect(retrieved?.version).toBe('2.0.0')
      expect(retrieved?.template).toBe('Hi {{name}}!')
    })

    it('should get specific version when requested', () => {
      const v1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      const v2: PromptEntry = {
        name: 'greeting',
        version: '2.0.0',
        template: 'Hi {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(v1)
      registerPrompt(v2)

      const retrieved = getPrompt('greeting', '1.0.0')
      expect(retrieved?.version).toBe('1.0.0')
      expect(retrieved?.template).toBe('Hello {{name}}!')
    })

    it('should return undefined for unknown prompt name', () => {
      const retrieved = getPrompt('nonexistent')
      expect(retrieved).toBeUndefined()
    })

    it('should return undefined for unknown version', () => {
      const entry: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const retrieved = getPrompt('greeting', '2.0.0')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('listPromptVersions', () => {
    it('should return all versions sorted descending', () => {
      const v1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello!',
        metadata: { createdAt: Date.now() },
      }

      const v2: PromptEntry = {
        name: 'greeting',
        version: '2.0.0',
        template: 'Hi!',
        metadata: { createdAt: Date.now() },
      }

      const v3: PromptEntry = {
        name: 'greeting',
        version: '1.5.0',
        template: 'Hey!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(v1)
      registerPrompt(v2)
      registerPrompt(v3)

      const versions = listPromptVersions('greeting')

      expect(versions).toHaveLength(3)
      expect(versions[0].version).toBe('2.0.0')
      expect(versions[1].version).toBe('1.5.0')
      expect(versions[2].version).toBe('1.0.0')
    })

    it('should return empty array for unknown prompt', () => {
      const versions = listPromptVersions('nonexistent')
      expect(versions).toEqual([])
    })

    it('should handle single version', () => {
      const entry: PromptEntry = {
        name: 'single',
        version: '1.0.0',
        template: 'Test',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const versions = listPromptVersions('single')
      expect(versions).toHaveLength(1)
      expect(versions[0].version).toBe('1.0.0')
    })
  })

  describe('renderPrompt', () => {
    it('should replace variable placeholders', () => {
      const entry: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}, welcome to {{place}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const rendered = renderPrompt('greeting', { name: 'Alice', place: 'Wonderland' })
      expect(rendered).toBe('Hello Alice, welcome to Wonderland!')
    })

    it('should handle multiple occurrences of same variable', () => {
      const entry: PromptEntry = {
        name: 'repeat',
        version: '1.0.0',
        template: '{{name}} is great! Yes, {{name}} is really great!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const rendered = renderPrompt('repeat', { name: 'Bob' })
      expect(rendered).toBe('Bob is great! Yes, Bob is really great!')
    })

    it('should throw on unknown prompt name', () => {
      expect(() => {
        renderPrompt('nonexistent', { name: 'test' })
      }).toThrow('Prompt not found: nonexistent')
    })

    it('should throw when specific version not found', () => {
      const entry: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      expect(() => {
        renderPrompt('greeting', {}, '2.0.0')
      }).toThrow('Prompt not found: greeting (version 2.0.0)')
    })

    it('should render latest version by default', () => {
      const v1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      const v2: PromptEntry = {
        name: 'greeting',
        version: '2.0.0',
        template: 'Hi {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(v1)
      registerPrompt(v2)

      const rendered = renderPrompt('greeting', { name: 'Alice' })
      expect(rendered).toBe('Hi Alice!')
    })

    it('should render specific version when requested', () => {
      const v1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      const v2: PromptEntry = {
        name: 'greeting',
        version: '2.0.0',
        template: 'Hi {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(v1)
      registerPrompt(v2)

      const rendered = renderPrompt('greeting', { name: 'Alice' }, '1.0.0')
      expect(rendered).toBe('Hello Alice!')
    })

    it('should handle templates with no variables', () => {
      const entry: PromptEntry = {
        name: 'static',
        version: '1.0.0',
        template: 'This is a static template.',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const rendered = renderPrompt('static', {})
      expect(rendered).toBe('This is a static template.')
    })

    it('should handle empty variable values', () => {
      const entry: PromptEntry = {
        name: 'optional',
        version: '1.0.0',
        template: 'Hello {{name}}!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry)

      const rendered = renderPrompt('optional', { name: '' })
      expect(rendered).toBe('Hello !')
    })
  })

  describe('clearRegistry', () => {
    it('should clear all registered prompts', () => {
      const entry1: PromptEntry = {
        name: 'greeting',
        version: '1.0.0',
        template: 'Hello!',
        metadata: { createdAt: Date.now() },
      }

      const entry2: PromptEntry = {
        name: 'farewell',
        version: '1.0.0',
        template: 'Goodbye!',
        metadata: { createdAt: Date.now() },
      }

      registerPrompt(entry1)
      registerPrompt(entry2)

      expect(getPrompt('greeting')).toBeDefined()
      expect(getPrompt('farewell')).toBeDefined()

      clearRegistry()

      expect(getPrompt('greeting')).toBeUndefined()
      expect(getPrompt('farewell')).toBeUndefined()
    })
  })
})
