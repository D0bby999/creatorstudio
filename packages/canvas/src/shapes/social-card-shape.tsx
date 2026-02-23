/// <reference path="../tldraw-custom-shapes.d.ts" />
import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'
import { loadFont } from '../lib/canvas-font-loader'

export type SocialCardShape = TLBaseShape<
  'social-card',
  {
    w: number
    h: number
    label: string
    platform: string
    backgroundColor: string
    title: string
    body: string
    ctaText: string
    fontFamily: string
    accentColor: string
    layout: string
  }
>

export class SocialCardShapeUtil extends ShapeUtil<SocialCardShape> {
  static override type = 'social-card' as const

  static override props: RecordProps<SocialCardShape> = {
    w: T.number,
    h: T.number,
    label: T.string,
    platform: T.string,
    backgroundColor: T.string,
    title: T.string,
    body: T.string,
    ctaText: T.string,
    fontFamily: T.string,
    accentColor: T.string,
    layout: T.string,
  }

  getDefaultProps(): SocialCardShape['props'] {
    return {
      w: 1080,
      h: 1080,
      label: 'Instagram Post',
      platform: 'instagram',
      backgroundColor: '#ffffff',
      title: '',
      body: '',
      ctaText: '',
      fontFamily: 'sans-serif',
      accentColor: '#3b82f6',
      layout: 'minimal',
    }
  }

  override canResize() { return true }
  override isAspectRatioLocked() { return true }

  getGeometry(shape: SocialCardShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: SocialCardShape) {
    const { fontFamily, layout } = shape.props
    if (fontFamily !== 'sans-serif') loadFont(fontFamily, 600)

    if (layout === 'standard') return this.renderStandard(shape)
    if (layout === 'full') return this.renderFull(shape)
    return this.renderMinimal(shape)
  }

  private renderMinimal(shape: SocialCardShape) {
    return (
      <HTMLContainer
        style={{
          width: '100%', height: '100%', backgroundColor: shape.props.backgroundColor,
          border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: shape.props.fontFamily, pointerEvents: 'all',
        }}
      >
        <div style={{ textAlign: 'center', color: '#999', userSelect: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{shape.props.label}</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>{shape.props.w} × {shape.props.h}</div>
        </div>
      </HTMLContainer>
    )
  }

  private renderStandard(shape: SocialCardShape) {
    const { backgroundColor, fontFamily, accentColor, title, body, ctaText } = shape.props
    return (
      <HTMLContainer
        style={{
          width: '100%', height: '100%', backgroundColor, fontFamily,
          display: 'flex', flexDirection: 'column', pointerEvents: 'all',
        }}
      >
        <div style={{ padding: '40px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {title && <div style={{ fontSize: 28, fontWeight: 700, color: '#222', marginBottom: 12, userSelect: 'none' }}>{title}</div>}
          {body && <div style={{ fontSize: 16, lineHeight: 1.6, color: '#555', userSelect: 'none' }}>{body}</div>}
        </div>
        {ctaText && (
          <div style={{ padding: '20px 32px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, background: accentColor, color: '#fff', fontSize: 14, fontWeight: 600, userSelect: 'none' }}>
              {ctaText}
            </div>
          </div>
        )}
      </HTMLContainer>
    )
  }

  private renderFull(shape: SocialCardShape) {
    const { backgroundColor, fontFamily, accentColor, label, title, body, ctaText } = shape.props
    return (
      <HTMLContainer
        style={{
          width: '100%', height: '100%', backgroundColor, fontFamily,
          display: 'flex', flexDirection: 'column', pointerEvents: 'all',
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', fontSize: 12, fontWeight: 600, color: '#888', userSelect: 'none' }}>
          {label}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px' }}>
          {title && <div style={{ fontSize: 28, fontWeight: 700, color: '#222', marginBottom: 12, userSelect: 'none' }}>{title}</div>}
          {body && <div style={{ fontSize: 16, lineHeight: 1.6, color: '#555', marginBottom: 20, userSelect: 'none' }}>{body}</div>}
          <div style={{ height: 120, background: '#f5f5f5', borderRadius: 8, border: '1px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 12, userSelect: 'none' }}>
            Image area
          </div>
        </div>
        {ctaText && (
          <div style={{ padding: '16px 32px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, background: accentColor, color: '#fff', fontSize: 14, fontWeight: 600, userSelect: 'none' }}>
              {ctaText}
            </div>
          </div>
        )}
      </HTMLContainer>
    )
  }

  indicator(shape: SocialCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: SocialCardShape) {
    return (
      <rect width={shape.props.w} height={shape.props.h} fill={shape.props.backgroundColor} stroke="#ccc" strokeDasharray="4" />
    )
  }
}
