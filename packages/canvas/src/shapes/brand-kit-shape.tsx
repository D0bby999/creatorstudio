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

export type BrandKitShape = TLBaseShape<
  'brand-kit',
  {
    w: number
    h: number
    brandName: string
    tagline: string
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    logoPlaceholder: boolean
  }
>

export class BrandKitShapeUtil extends ShapeUtil<BrandKitShape> {
  static override type = 'brand-kit' as const

  static override props: RecordProps<BrandKitShape> = {
    w: T.number,
    h: T.number,
    brandName: T.string,
    tagline: T.string,
    primaryColor: T.string,
    secondaryColor: T.string,
    fontFamily: T.string,
    logoPlaceholder: T.boolean,
  }

  getDefaultProps(): BrandKitShape['props'] {
    return {
      w: 400,
      h: 300,
      brandName: 'Brand Name',
      tagline: 'Your tagline here',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      fontFamily: 'sans-serif',
      logoPlaceholder: true,
    }
  }

  override canResize() { return true }
  override isAspectRatioLocked() { return false }

  getGeometry(shape: BrandKitShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: BrandKitShape) {
    const { brandName, tagline, primaryColor, secondaryColor, fontFamily, logoPlaceholder } = shape.props
    if (fontFamily !== 'sans-serif') loadFont(fontFamily, 700)

    return (
      <HTMLContainer
        style={{
          width: '100%', height: '100%', background: '#fafafa',
          border: '1px solid #e5e5e5', borderRadius: 8, padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, fontFamily, pointerEvents: 'all',
        }}
      >
        {logoPlaceholder && (
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 700, userSelect: 'none',
          }}>
            {brandName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 700, color: '#222', userSelect: 'none', textAlign: 'center' }}>
          {brandName}
        </div>
        {tagline && (
          <div style={{ fontSize: 13, color: '#888', userSelect: 'none', textAlign: 'center' }}>
            {tagline}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: primaryColor, border: '1px solid #ddd' }} title={primaryColor} />
          <div style={{ width: 32, height: 32, borderRadius: 6, background: secondaryColor, border: '1px solid #ddd' }} title={secondaryColor} />
        </div>
        <div style={{ fontSize: 10, color: '#bbb', userSelect: 'none' }}>
          {fontFamily}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: BrandKitShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: BrandKitShape) {
    return (
      <g>
        <rect width={shape.props.w} height={shape.props.h} fill="#fafafa" stroke="#e5e5e5" rx={8} />
        <text x={shape.props.w / 2} y={shape.props.h / 2} textAnchor="middle" fill="#222" fontSize={22} fontWeight={700} fontFamily={shape.props.fontFamily}>
          {shape.props.brandName}
        </text>
        <text x={shape.props.w / 2} y={shape.props.h / 2 + 28} textAnchor="middle" fill="#888" fontSize={13} fontFamily={shape.props.fontFamily}>
          {shape.props.tagline}
        </text>
      </g>
    )
  }
}
