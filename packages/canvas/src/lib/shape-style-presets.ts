import type { Editor } from 'tldraw'

export interface StylePreset {
  name: string
  props: Record<string, string | number>
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: 'Shadow Card',
    props: { backgroundColor: '#ffffff', accentColor: '#333333' },
  },
  {
    name: 'Outlined',
    props: { backgroundColor: '#ffffff', accentColor: '#111111' },
  },
  {
    name: 'Gradient Pop',
    props: { bgGradientFrom: '#f97316', bgGradientTo: '#ec4899', textColor: '#ffffff' },
  },
  {
    name: 'Minimal',
    props: { backgroundColor: '#fafafa', accentColor: '#666666' },
  },
  {
    name: 'Dark Mode',
    props: { backgroundColor: '#1a1a2e', textColor: '#e0e0e0', accentColor: '#0ea5e9', bgColor: '#1a1a2e' },
  },
  {
    name: 'Glassmorphism',
    props: { backgroundColor: '#ffffff', bgOpacity: 0.15, textColor: '#ffffff' },
  },
]

export function applyStylePreset(editor: Editor, shapeIds: string[], preset: StylePreset): void {
  const updates = shapeIds.map((id) => {
    const shape = editor.getShape(id as any)
    if (!shape) return null
    const applicableProps: Record<string, any> = {}
    const shapeProps = shape.props as Record<string, any>
    for (const [key, value] of Object.entries(preset.props)) {
      if (key in shapeProps) {
        applicableProps[key] = value
      }
    }
    if (Object.keys(applicableProps).length === 0) return null
    return { id: shape.id, type: shape.type, props: applicableProps }
  }).filter(Boolean)

  if (updates.length > 0) {
    editor.updateShapes(updates as any)
  }
}
