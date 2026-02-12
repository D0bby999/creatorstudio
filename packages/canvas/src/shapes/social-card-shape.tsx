import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'

/** Social card shape for Instagram/YouTube/Twitter templates */
export type SocialCardShape = TLBaseShape<
  'social-card',
  {
    w: number
    h: number
    label: string
    platform: string
    backgroundColor: string
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
  }

  getDefaultProps(): SocialCardShape['props'] {
    return {
      w: 1080,
      h: 1080,
      label: 'Instagram Post',
      platform: 'instagram',
      backgroundColor: '#ffffff',
    }
  }

  override canResize() {
    return true
  }

  override isAspectRatioLocked() {
    return true
  }

  getGeometry(shape: SocialCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: SocialCardShape) {
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: shape.props.backgroundColor,
          border: '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          pointerEvents: 'all',
        }}
      >
        <div style={{ textAlign: 'center', color: '#999', userSelect: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{shape.props.label}</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {shape.props.w} × {shape.props.h}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: SocialCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: SocialCardShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        fill={shape.props.backgroundColor}
        stroke="#ccc"
        strokeDasharray="4"
      />
    )
  }
}
