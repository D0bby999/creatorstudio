import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'

/** Quote card shape for inspirational quotes with gradient background */
export type QuoteCardShape = TLBaseShape<
  'quote-card',
  {
    w: number
    h: number
    quoteText: string
    author: string
    bgGradientFrom: string
    bgGradientTo: string
    textColor: string
  }
>

export class QuoteCardShapeUtil extends ShapeUtil<QuoteCardShape> {
  static override type = 'quote-card' as const

  static override props: RecordProps<QuoteCardShape> = {
    w: T.number,
    h: T.number,
    quoteText: T.string,
    author: T.string,
    bgGradientFrom: T.string,
    bgGradientTo: T.string,
    textColor: T.string,
  }

  getDefaultProps(): QuoteCardShape['props'] {
    return {
      w: 1080,
      h: 1080,
      quoteText: 'Your inspiring quote here',
      author: 'Author Name',
      bgGradientFrom: '#8b5cf6',
      bgGradientTo: '#ec4899',
      textColor: '#ffffff',
    }
  }

  override canResize() {
    return true
  }

  override isAspectRatioLocked() {
    return true
  }

  getGeometry(shape: QuoteCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: QuoteCardShape) {
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${shape.props.bgGradientFrom}, ${shape.props.bgGradientTo})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          fontFamily: 'sans-serif',
          color: shape.props.textColor,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.4,
            marginBottom: 24,
            userSelect: 'none',
          }}
        >
          "{shape.props.quoteText}"
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            opacity: 0.9,
            userSelect: 'none',
          }}
        >
          — {shape.props.author}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: QuoteCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: QuoteCardShape) {
    return (
      <g>
        <defs>
          <linearGradient id={`quote-grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={shape.props.bgGradientFrom} />
            <stop offset="100%" stopColor={shape.props.bgGradientTo} />
          </linearGradient>
        </defs>
        <rect
          width={shape.props.w}
          height={shape.props.h}
          fill={`url(#quote-grad-${shape.id})`}
        />
        <text
          x={shape.props.w / 2}
          y={shape.props.h / 2 - 20}
          textAnchor="middle"
          fill={shape.props.textColor}
          fontSize={32}
          fontWeight={600}
        >
          "{shape.props.quoteText}"
        </text>
        <text
          x={shape.props.w / 2}
          y={shape.props.h / 2 + 40}
          textAnchor="middle"
          fill={shape.props.textColor}
          fontSize={18}
        >
          — {shape.props.author}
        </text>
      </g>
    )
  }
}
