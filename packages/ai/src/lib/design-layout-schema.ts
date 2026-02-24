/**
 * Zod schemas for AI design layout generation
 * Defines element types, layout structure, and template presets
 */

import { z } from 'zod'

export const DesignLayoutElementSchema = z.object({
  type: z.enum(['rectangle', 'text', 'ellipse', 'image-placeholder', 'line']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  content: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  textAlign: z.enum(['start', 'middle', 'end']).optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  cornerRadius: z.number().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().optional(),
})

export const DesignLayoutSchema = z.object({
  title: z.string(),
  width: z.number(),
  height: z.number(),
  backgroundColor: z.string().optional(),
  elements: z.array(DesignLayoutElementSchema).min(1).max(30),
})

export type DesignLayoutElement = z.infer<typeof DesignLayoutElementSchema>
export type DesignLayout = z.infer<typeof DesignLayoutSchema>

export interface DesignTemplatePreset {
  id: string
  label: string
  width: number
  height: number
  description: string
  promptHint: string
}

export const DESIGN_TEMPLATE_PRESETS: DesignTemplatePreset[] = [
  {
    id: 'social-post',
    label: 'Social Post',
    width: 1080,
    height: 1080,
    description: 'Instagram/Facebook square post',
    promptHint: 'Design for a 1080x1080 square social media post.',
  },
  {
    id: 'story',
    label: 'Story',
    width: 1080,
    height: 1920,
    description: 'Instagram/TikTok vertical story',
    promptHint: 'Design for a 1080x1920 vertical story format.',
  },
  {
    id: 'banner',
    label: 'Banner',
    width: 1200,
    height: 628,
    description: 'Facebook/LinkedIn banner',
    promptHint: 'Design for a 1200x628 horizontal banner.',
  },
  {
    id: 'presentation',
    label: 'Presentation',
    width: 1920,
    height: 1080,
    description: '16:9 presentation slide',
    promptHint: 'Design for a 1920x1080 presentation slide.',
  },
]
