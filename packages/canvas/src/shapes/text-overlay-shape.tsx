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
import { useCallback } from 'react'
import { loadFont } from '../lib/canvas-font-loader'

export type TextOverlayShape = TLBaseShape<
  'text-overlay',
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

export class TextOverlayShapeUtil extends ShapeUtil<TextOverlayShape> {
  static override type = 'text-overlay' as const

  static override props: RecordProps<TextOverlayShape> = {
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

  getDefaultProps(): TextOverlayShape['props'] {
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

  getGeometry(shape: TextOverlayShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: TextOverlayShape) {
    return <TextOverlayComponent shape={shape} />
  }

  indicator(shape: TextOverlayShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: TextOverlayShape) {
    const { fontFamily, fontWeight, fontSize } = shape.props
    const yMap: Record<string, number> = { top: shape.props.h * 0.25, center: shape.props.h * 0.5, bottom: shape.props.h * 0.75 }
    return (
      <g>
        <rect width={shape.props.w} height={shape.props.h} fill={`rgba(0,0,0,${shape.props.bgOpacity})`} />
        <text
          x={shape.props.w / 2} y={yMap[shape.props.position]}
          textAnchor="middle" fill={shape.props.textColor}
          fontSize={fontSize} fontWeight={fontWeight} fontFamily={fontFamily}
        >
          {shape.props.text}
        </text>
      </g>
    )
  }
}

function TextOverlayComponent({ shape }: { shape: TextOverlayShape }) {
  const editor = useEditor()
  const isEditing = useIsEditing(shape.id)
  const { fontFamily, fontWeight, textAlign, letterSpacing, lineHeight } = shape.props
  if (fontFamily !== 'sans-serif') loadFont(fontFamily, fontWeight)

  const alignMap: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' }

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newText = (e.target as HTMLDivElement).innerText
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { text: newText },
    })
  }, [editor, shape.id, shape.type])

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
          }}
        >
          {shape.props.text}
        </div>
      )}
    </HTMLContainer>
  )
}
