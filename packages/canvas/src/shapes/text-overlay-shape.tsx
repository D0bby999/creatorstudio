import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'

/** Text overlay shape with semi-transparent background */
export type TextOverlayShape = TLBaseShape<
  'text-overlay',
  {
    w: number
    h: number
    text: string
    fontSize: number
    textColor: string
    bgOpacity: number
    position: 'top' | 'center' | 'bottom'
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
  }

  getDefaultProps(): TextOverlayShape['props'] {
    return {
      w: 1080,
      h: 200,
      text: 'Your text here',
      fontSize: 48,
      textColor: '#ffffff',
      bgOpacity: 0.5,
      position: 'center',
    }
  }

  override canResize() {
    return true
  }

  override isAspectRatioLocked() {
    return false
  }

  getGeometry(shape: TextOverlayShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: TextOverlayShape) {
    const alignMap = {
      top: 'flex-start',
      center: 'center',
      bottom: 'flex-end',
    }
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: `rgba(0, 0, 0, ${shape.props.bgOpacity})`,
          display: 'flex',
          alignItems: alignMap[shape.props.position],
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'sans-serif',
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            fontSize: shape.props.fontSize,
            fontWeight: 700,
            color: shape.props.textColor,
            textAlign: 'center',
            lineHeight: 1.2,
            userSelect: 'none',
          }}
        >
          {shape.props.text}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: TextOverlayShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: TextOverlayShape) {
    const yPosMap = {
      top: shape.props.h * 0.25,
      center: shape.props.h * 0.5,
      bottom: shape.props.h * 0.75,
    }
    return (
      <g>
        <rect
          width={shape.props.w}
          height={shape.props.h}
          fill={`rgba(0, 0, 0, ${shape.props.bgOpacity})`}
        />
        <text
          x={shape.props.w / 2}
          y={yPosMap[shape.props.position]}
          textAnchor="middle"
          fill={shape.props.textColor}
          fontSize={shape.props.fontSize}
          fontWeight={700}
        >
          {shape.props.text}
        </text>
      </g>
    )
  }
}
