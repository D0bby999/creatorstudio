/**
 * Applies brand kit colors and fonts to existing canvas shapes
 */
import type { Editor, TLShape } from 'tldraw'
import type { BrandKitData } from './brand-kit-types'

export function applyBrandKit(editor: Editor, kit: BrandKitData): number {
  const page = editor.getCurrentPage()
  const shapes = editor.getCurrentPageShapes()

  const colorMap = buildColorMap(kit)
  const fontMap = buildFontMap(kit)

  const updates: any[] = []

  for (const shape of shapes) {
    const props = applyBrandToShape(shape, colorMap, fontMap)
    if (props && Object.keys(props).length > 0) {
      updates.push({ id: shape.id, type: shape.type, props })
    }
  }

  if (updates.length > 0) {
    editor.updateShapes(updates)
  }

  return updates.length
}

function buildColorMap(kit: BrandKitData): Map<string, string> {
  const map = new Map<string, string>()
  for (const color of kit.colors) {
    map.set(color.role, color.hex)
  }
  return map
}

function buildFontMap(kit: BrandKitData): Map<string, { family: string; weight: number }> {
  const map = new Map<string, { family: string; weight: number }>()
  for (const font of kit.fonts) {
    map.set(font.role, { family: font.family, weight: font.weight })
  }
  return map
}

function applyBrandToShape(
  shape: TLShape,
  colors: Map<string, string>,
  fonts: Map<string, { family: string; weight: number }>
): Record<string, any> | null {
  const props: Record<string, any> = {}

  // Apply colors based on shape type
  const primaryColor = colors.get('primary')
  const textColor = colors.get('text')
  const accentColor = colors.get('accent')
  const bgColor = colors.get('bg')
  const secondaryColor = colors.get('secondary')

  // Shape-specific color mapping
  if (shape.type === 'social-card' || shape.type === 'quote-card' || shape.type === 'carousel-slide') {
    if (primaryColor && 'backgroundColor' in shape.props) props.backgroundColor = primaryColor
    if (textColor && 'textColor' in shape.props) props.textColor = textColor
    if (accentColor && 'accentColor' in shape.props) props.accentColor = accentColor
  }

  if (shape.type === 'text-overlay' || shape.type === 'enhanced-text') {
    if (textColor && 'color' in shape.props) props.color = textColor
    if (bgColor && 'bgColor' in shape.props) props.bgColor = bgColor
  }

  if (shape.type === 'brand-kit') {
    if (primaryColor && 'primaryColor' in shape.props) props.primaryColor = primaryColor
    if (secondaryColor && 'secondaryColor' in shape.props) props.secondaryColor = secondaryColor
  }

  // Apply fonts based on shape type
  const headingFont = fonts.get('heading')
  const bodyFont = fonts.get('body')

  if (headingFont) {
    if (shape.type === 'social-card' && 'titleFontFamily' in shape.props) {
      props.titleFontFamily = headingFont.family
      if ('titleFontWeight' in shape.props) props.titleFontWeight = headingFont.weight
    }
    if (shape.type === 'enhanced-text' && 'fontFamily' in shape.props) {
      props.fontFamily = headingFont.family
      if ('fontWeight' in shape.props) props.fontWeight = headingFont.weight
    }
  }

  if (bodyFont) {
    if ((shape.type === 'social-card' || shape.type === 'quote-card') && 'bodyFontFamily' in shape.props) {
      props.bodyFontFamily = bodyFont.family
      if ('bodyFontWeight' in shape.props) props.bodyFontWeight = bodyFont.weight
    }
  }

  return Object.keys(props).length > 0 ? props : null
}
