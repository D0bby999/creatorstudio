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

export type CarouselSlideShape = TLBaseShape<
  'carousel-slide',
  {
    w: number
    h: number
    slideNumber: number
    totalSlides: number
    title: string
    body: string
    bgColor: string
    titleFontFamily: string
    titleFontWeight: number
    bodyFontFamily: string
    bodyFontSize: number
  }
>

export class CarouselSlideShapeUtil extends ShapeUtil<CarouselSlideShape> {
  static override type = 'carousel-slide' as const

  static override props: RecordProps<CarouselSlideShape> = {
    w: T.number,
    h: T.number,
    slideNumber: T.number,
    totalSlides: T.number,
    title: T.string,
    body: T.string,
    bgColor: T.string,
    titleFontFamily: T.string,
    titleFontWeight: T.number,
    bodyFontFamily: T.string,
    bodyFontSize: T.number,
  }

  getDefaultProps(): CarouselSlideShape['props'] {
    return {
      w: 1080,
      h: 1080,
      slideNumber: 1,
      totalSlides: 5,
      title: 'Slide Title',
      body: 'Add your content here',
      bgColor: '#ffffff',
      titleFontFamily: 'sans-serif',
      titleFontWeight: 700,
      bodyFontFamily: 'sans-serif',
      bodyFontSize: 16,
    }
  }

  override canResize() { return true }
  override isAspectRatioLocked() { return true }

  getGeometry(shape: CarouselSlideShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: CarouselSlideShape) {
    const { titleFontFamily, titleFontWeight, bodyFontFamily, bodyFontSize } = shape.props
    if (titleFontFamily !== 'sans-serif') loadFont(titleFontFamily, titleFontWeight)
    if (bodyFontFamily !== 'sans-serif') loadFont(bodyFontFamily, 400)

    const dots = Array.from({ length: shape.props.totalSlides }, (_, i) => i)
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: shape.props.bgColor,
          border: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          pointerEvents: 'all',
        }}
      >
        <div style={{ padding: '20px 24px', fontSize: 14, fontWeight: 600, color: '#999', textAlign: 'right', borderBottom: '1px solid #e5e5e5', userSelect: 'none' }}>
          {shape.props.slideNumber} / {shape.props.totalSlides}
        </div>
        <div style={{ flex: 1, padding: '40px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, fontWeight: titleFontWeight, fontFamily: titleFontFamily, color: '#333', marginBottom: 16, userSelect: 'none' }}>
            {shape.props.title}
          </div>
          <div style={{ fontSize: bodyFontSize, fontFamily: bodyFontFamily, lineHeight: 1.6, color: '#666', userSelect: 'none' }}>
            {shape.props.body}
          </div>
        </div>
        <div style={{ padding: '20px 0', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          {dots.map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === shape.props.slideNumber - 1 ? '#333' : '#ccc' }} />
          ))}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: CarouselSlideShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: CarouselSlideShape) {
    const { titleFontFamily, titleFontWeight, bodyFontFamily, bodyFontSize } = shape.props
    return (
      <g>
        <rect width={shape.props.w} height={shape.props.h} fill={shape.props.bgColor} stroke="#e5e5e5" />
        <text x={shape.props.w - 24} y={40} textAnchor="end" fill="#999" fontSize={14} fontWeight={600}>
          {shape.props.slideNumber} / {shape.props.totalSlides}
        </text>
        <text x={32} y={80} fill="#333" fontSize={28} fontWeight={titleFontWeight} fontFamily={titleFontFamily}>
          {shape.props.title}
        </text>
        <text x={32} y={120} fill="#666" fontSize={bodyFontSize} fontFamily={bodyFontFamily}>
          {shape.props.body}
        </text>
      </g>
    )
  }
}
