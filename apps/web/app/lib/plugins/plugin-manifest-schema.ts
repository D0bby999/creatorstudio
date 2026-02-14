import { z } from 'zod'

export const PluginManifestSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format (e.g., 1.0.0)'),
  description: z.string().max(500).optional(),
  author: z.string().optional(),
  main: z.string().min(1, 'Entry point is required'),
  activationEvents: z
    .array(
      z.enum(['onStartup', 'onPost', 'onPublish', 'onExport', 'onCanvasSave'], {
        errorMap: () => ({ message: 'Invalid activation event' }),
      })
    )
    .min(1, 'At least one activation event is required'),
  contributes: z
    .object({
      commands: z
        .array(
          z.object({
            command: z.string().min(1),
            title: z.string().min(1),
          })
        )
        .optional(),
      hooks: z
        .array(
          z.enum([
            'post.creating',
            'post.created',
            'post.publishing',
            'post.published',
            'export.completed',
            'canvas.saved',
            'canvas.loaded',
          ])
        )
        .optional(),
    })
    .optional(),
  permissions: z
    .object({
      network: z.array(z.string().url()).optional(),
      storage: z.boolean().optional(),
      clipboard: z.boolean().optional(),
    })
    .optional(),
})

export type PluginManifest = z.infer<typeof PluginManifestSchema>

export function validatePluginManifest(data: unknown): {
  success: boolean
  data?: PluginManifest
  error?: string
} {
  try {
    const result = PluginManifestSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') }
    }
    return { success: false, error: 'Invalid manifest format' }
  }
}
