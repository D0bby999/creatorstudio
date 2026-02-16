import type { CrawlTemplate, CrawlerEngineConfig } from '../types/crawler-types.js'

export interface CreateTemplateInput {
  name: string
  description?: string
  config: Partial<CrawlerEngineConfig>
  isPublic: boolean
  userId: string
}

/**
 * Manages crawl job templates for reusable configurations.
 * Templates allow users to save common crawl settings and share them.
 * In-memory storage - Prisma integration deferred to API routes.
 */
export class JobTemplateManager {
  private templates: Map<string, CrawlTemplate>

  constructor() {
    this.templates = new Map()
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return crypto.randomUUID()
  }

  /**
   * Create a new template
   */
  createTemplate(input: CreateTemplateInput): CrawlTemplate {
    const now = new Date().toISOString()
    const template: CrawlTemplate = {
      id: this.generateTemplateId(),
      name: input.name,
      description: input.description,
      config: input.config,
      isPublic: input.isPublic,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    }

    this.templates.set(template.id, template)
    return template
  }

  /**
   * List all templates for a user (including public templates)
   */
  listTemplates(userId: string): CrawlTemplate[] {
    const userTemplates = Array.from(this.templates.values()).filter(
      (t) => t.userId === userId || t.isPublic
    )
    return userTemplates.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): CrawlTemplate | null {
    return this.templates.get(templateId) ?? null
  }

  /**
   * Update an existing template
   */
  updateTemplate(templateId: string, updates: Partial<CreateTemplateInput>): CrawlTemplate {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    Object.assign(template, updates)
    template.updatedAt = new Date().toISOString()

    this.templates.set(templateId, template)
    return template
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  /**
   * Clear all templates (for testing)
   */
  clearTemplates(): void {
    this.templates.clear()
  }
}
