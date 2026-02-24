/// <reference path="../tldraw-custom-shapes.d.ts" />
import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
  useIsEditing,
  useEditor,
} from 'tldraw'
import { useCallback, useEffect } from 'react'
import { loadFont } from '../lib/canvas-font-loader'
import type { TextEffectsMeta } from '../lib/text-effects/text-effect-types'
import { buildTextShadow } from '../lib/text-effects/text-shadow-renderer'
import { buildTextOutlineStyle } from '../lib/text-effects/text-outline-renderer'
import { buildTextGlow } from '../lib/text-effects/text-glow-renderer'
import { CurvedText } from '../lib/text-effects/text-curve-renderer'

export type EnhancedTextShape = TLBaseShape<
  'enhanced-text',
  {
    w: number
    h: number
    text: string
    fontSize: number
    textColor: string
    bgOpacity: number
    position: string
    fontFamily: string
    fontWeight: number
    textAlign: string
    letterSpacing: number
    lineHeight: number
  }
>

export class EnhancedTextShapeUtil extends ShapeUtil<EnhancedTextShape> {
  static override type = 'enhanced-text' as const

  static override props: RecordProps<EnhancedTextShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    fontSize: T.number,
    textColor: T.string,
    bgOpacity: T.number,
    position: T.string,
    fontFamily: T.string,
    fontWeight: T.number,
    textAlign: T.string,
    letterSpacing: T.number,
    lineHeight: T.number,
  }

  getDefaultProps(): EnhancedTextShape['props'] {
    return {
      w: 1080, h: 200,
      text: 'Your text here',
      fontSize: 48, textColor: '#ffffff',
      bgOpacity: 0.5, position: 'center',
      fontFamily: 'sans-serif', fontWeight: 700,
      textAlign: 'center', letterSpacing: 0, lineHeight: 1.2,
    }
  }

  override canResize() { return true }
  override isAspectRatioLocked() { return false }
  override canEdit() { return true }

  getGeometry(shape: EnhancedTextShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: EnhancedTextShape) {
    return <EnhancedTextComponent shape={shape} />
  }

  indicator(shape: EnhancedTextShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: EnhancedTextShape) {
    const { fontFamily, fontWeight, fontSize } = shape.props
    const effects = (shape.meta?.textEffects ?? {}) as TextEffectsMeta

    let textStyle = `font-size: ${fontSize}px; font-weight: ${fontWeight}; font-family: ${fontFamily};`
    if (effects.shadow) textStyle += ` text-shadow: ${buildTextShadow(effects.shadow)};`
    if (effects.outline) textStyle += ` -webkit-text-stroke: ${effects.outline.width}px ${effects.outline.color}; paint-order: stroke fill;`
    if (effects.glow) textStyle += ` text-shadow: ${buildTextGlow(effects.glow)};`

    return (
      <foreignObject width={shape.props.w} height={shape.props.h}>
        <div style={{ background: `rgba(0,0,0,${shape.props.bgOpacity})`, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <span style={{ color: shape.props.textColor, textAlign: shape.props.textAlign as any, ...Object.fromEntries(textStyle.split(';').filter(Boolean).map(s => { const [k, ...v] = s.split(':'); return [k.trim(), v.join(':').trim()] })) }}>
            {shape.props.text}
          </span>
        </div>
      </foreignObject>
    )
  }
}

function EnhancedTextComponent({ shape }: { shape: EnhancedTextShape }) {
  const editor = useEditor()
  const isEditing = useIsEditing(shape.id)
  const { fontFamily, fontWeight, textAlign, letterSpacing, lineHeight } = shape.props
  const effects = (shape.meta?.textEffects ?? {}) as TextEffectsMeta

  useEffect(() => {
    if (fontFamily !== 'sans-serif') loadFont(fontFamily, fontWeight)
  }, [fontFamily, fontWeight])

  const alignMap: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' }

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newText = (e.target as HTMLDivElement).innerText
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { text: newText },
    })
  }, [editor, shape.id, shape.type])

  // Build combined text effects styles
  const textEffectStyles: React.CSSProperties = {}
  const shadowLayers: string[] = []

  if (effects.shadow) {
    shadowLayers.push(buildTextShadow(effects.shadow))
  }
  if (effects.glow) {
    shadowLayers.push(buildTextGlow(effects.glow))
  }
  if (shadowLayers.length > 0) {
    textEffectStyles.textShadow = shadowLayers.join(', ')
  }
  if (effects.outline) {
    Object.assign(textEffectStyles, buildTextOutlineStyle(effects.outline))
  }

  // Render curved text if curve mode is active
  if (effects.curve) {
    return (
      <HTMLContainer
        style={{
          width: '100%', height: '100%',
          backgroundColor: `rgba(0,0,0,${shape.props.bgOpacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily,
          pointerEvents: 'all',
        }}
      >
        <CurvedText
          text={shape.props.text}
          mode={effects.curve.mode}
          radius={effects.curve.radius}
          fontSize={shape.props.fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fill={shape.props.textColor}
          letterSpacing={letterSpacing}
        />
      </HTMLContainer>
    )
  }

  // Standard text rendering with effects
  return (
    <HTMLContainer
      style={{
        width: '100%', height: '100%',
        backgroundColor: `rgba(0,0,0,${shape.props.bgOpacity})`,
        display: 'flex',
        alignItems: alignMap[shape.props.position],
        justifyContent: 'center',
        padding: '20px',
        fontFamily,
        pointerEvents: 'all',
      }}
    >
      {isEditing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{
            fontSize: shape.props.fontSize, fontWeight,
            color: shape.props.textColor,
            textAlign: textAlign as any,
            lineHeight, letterSpacing,
            outline: '2px solid #3b82f6',
            outlineOffset: 4,
            borderRadius: 2,
            minWidth: 20, minHeight: 24,
            cursor: 'text',
            wordBreak: 'break-word',
            ...textEffectStyles,
          }}
        >
          {shape.props.text}
        </div>
      ) : (
        <div
          style={{
            fontSize: shape.props.fontSize, fontWeight,
            color: shape.props.textColor,
            textAlign: textAlign as any,
            lineHeight, letterSpacing,
            userSelect: 'none',
            ...textEffectStyles,
          }}
        >
          {shape.props.text}
        </div>
      )}
    </HTMLContainer>
  )
}
