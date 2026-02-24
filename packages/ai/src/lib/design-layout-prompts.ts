/**
 * System prompts and prompt builders for AI design layout generation
 */

import type { DesignLayout, DesignTemplatePreset } from './design-layout-schema'

const DESIGN_LAYOUT_SYSTEM_PROMPT = `You are a professional graphic designer. Generate a JSON layout for a visual design.

Rules:
- All coordinates must be within canvas bounds (0,0 to width,height)
- Elements must NOT overlap
- Use a maximum of 4 colors for harmony
- Font sizes: headings 32-48px, subheadings 20-28px, body 14-20px
- Maintain visual hierarchy: heading > subheading > body text
- Use cornerRadius for modern feel (8-16px on rectangles)
- Include padding/margins between elements (at least 20px)
- For image-placeholder: use dashed border style, include descriptive content text
- zIndex determines layering: background elements = 0, content = 1-5, foreground = 10+

Element types available:
- rectangle: colored background blocks, cards, dividers
- text: headings, body text, labels
- ellipse: decorative circles, avatars
- image-placeholder: where photos/images would go
- line: dividers, decorative lines`

export function buildDesignPrompt(
  userPrompt: string,
  preset: DesignTemplatePreset | null,
): string {
  const presetContext = preset
    ? `\n\nCanvas: ${preset.width}x${preset.height}px. ${preset.promptHint}`
    : '\n\nCanvas: 1080x1080px. Square format.'

  return `${DESIGN_LAYOUT_SYSTEM_PROMPT}${presetContext}

User request: ${userPrompt}

Generate a complete design layout as JSON.`
}

export function buildRefinementPrompt(
  instruction: string,
  currentLayout: DesignLayout,
): string {
  const layoutJson = JSON.stringify(currentLayout, null, 2)

  return `${DESIGN_LAYOUT_SYSTEM_PROMPT}

Current design layout:
\`\`\`json
${layoutJson}
\`\`\`

Refinement instruction: ${instruction}

Apply the refinement to the existing layout. Return the complete updated layout as JSON.`
}
